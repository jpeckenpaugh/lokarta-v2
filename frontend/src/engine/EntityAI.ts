import { GridMap } from './GridMap';
import { LightingSystem } from './LightingSystem';
import { PlayerEntity, MonsterEntity, Projectile, Coordinates, Direction } from '../types/entity';
import { CONFIG } from '../config';

export interface AIActionResult {
  damageToPlayer?: number;
  message?: string;
  projectiles?: Projectile[];
}

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

export class EntityAI {
  public static updateMonsters(
    monsters: MonsterEntity[],
    player: PlayerEntity,
    gridMap: GridMap,
    deltaSec: number
  ): AIActionResult[] {
    const results: AIActionResult[] = [];

    // Decrement monster cooldowns
    for (const monster of monsters) {
      if (monster.attackCooldown > 0) {
        monster.attackCooldown = Math.max(0, monster.attackCooldown - deltaSec);
      }

      if (!monster.isAggroed) continue;

      if (monster.type === 'crypt_skeleton') {
        const action = EntityAI.updateSkeleton(monster, player, gridMap, monsters);
        if (action) results.push(action);
      } else if (monster.type === 'shadow_cultist') {
        const action = EntityAI.updateCultist(monster, player, gridMap, monsters);
        if (action) results.push(action);
      }
    }

    return results;
  }

  private static updateSkeleton(
    skeleton: MonsterEntity,
    player: PlayerEntity,
    gridMap: GridMap,
    allMonsters: MonsterEntity[]
  ): AIActionResult | null {
    const distManhattan = Math.abs(skeleton.x - player.x) + Math.abs(skeleton.y - player.y);

    // If adjacent (cardinal dist == 1)
    if (distManhattan === 1) {
      if (skeleton.attackCooldown <= 0) {
        skeleton.attackCooldown = skeleton.attackCadence;
        const damage = Math.floor(Math.random() * (CONFIG.SKELETON_DAMAGE_MAX - CONFIG.SKELETON_DAMAGE_MIN + 1)) + CONFIG.SKELETON_DAMAGE_MIN;
        player.hp = Math.max(0, player.hp - damage);
        return {
          damageToPlayer: damage,
          message: `${skeleton.name} slashes you for ${damage} physical damage!`,
        };
      }
      return null;
    }

    // Otherwise, move towards player using A*
    const nextStep = EntityAI.findNextStepAStar(
      { x: skeleton.x, y: skeleton.y },
      { x: player.x, y: player.y },
      gridMap,
      allMonsters.filter(m => m.id !== skeleton.id)
    );

    if (nextStep && (nextStep.x !== player.x || nextStep.y !== player.y)) {
      skeleton.facing = EntityAI.getFacing(skeleton.x, skeleton.y, nextStep.x, nextStep.y);
      skeleton.x = nextStep.x;
      skeleton.y = nextStep.y;
    }

    return null;
  }

  private static updateCultist(
    cultist: MonsterEntity,
    player: PlayerEntity,
    gridMap: GridMap,
    allMonsters: MonsterEntity[]
  ): AIActionResult | null {
    const dist = Math.hypot(cultist.x - player.x, cultist.y - player.y);
    const hasLOS = LightingSystem.hasLineOfSight(gridMap, cultist.x, cultist.y, player.x, player.y);

    // 1. If distance < 3, retreat to open tile
    if (dist < CONFIG.CULTIST_STANDOFF_MIN) {
      const retreatStep = EntityAI.findRetreatStep(cultist, player, gridMap, allMonsters);
      if (retreatStep) {
        cultist.facing = EntityAI.getFacing(cultist.x, cultist.y, retreatStep.x, retreatStep.y);
        cultist.x = retreatStep.x;
        cultist.y = retreatStep.y;
      }
    }
    // 2. If distance > 4, advance towards sweet spot
    else if (dist > CONFIG.CULTIST_STANDOFF_MAX) {
      const nextStep = EntityAI.findNextStepAStar(
        { x: cultist.x, y: cultist.y },
        { x: player.x, y: player.y },
        gridMap,
        allMonsters.filter(m => m.id !== cultist.id)
      );
      if (nextStep && (nextStep.x !== player.x || nextStep.y !== player.y)) {
        cultist.facing = EntityAI.getFacing(cultist.x, cultist.y, nextStep.x, nextStep.y);
        cultist.x = nextStep.x;
        cultist.y = nextStep.y;
      }
    }

    // 3. Attack if in range (3-4) and has LOS and cooldown ready
    if (dist <= 5 && hasLOS && cultist.attackCooldown <= 0) {
      cultist.attackCooldown = cultist.attackCadence;
      const damage = Math.floor(Math.random() * (CONFIG.CULTIST_DAMAGE_MAX - CONFIG.CULTIST_DAMAGE_MIN + 1)) + CONFIG.CULTIST_DAMAGE_MIN;
      player.hp = Math.max(0, player.hp - damage);

      const projectile: Projectile = {
        id: `proj_shadow_${Date.now()}_${Math.random()}`,
        type: 'shadow_bolt',
        sourceX: cultist.x,
        sourceY: cultist.y,
        targetX: player.x,
        targetY: player.y,
        currentX: cultist.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
        currentY: cultist.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
        durationMs: 300,
        elapsedMs: 0,
        color: '#9933ff',
      };

      return {
        damageToPlayer: damage,
        message: `${cultist.name} casts Shadow Bolt at you for ${damage} dark damage!`,
        projectiles: [projectile],
      };
    }

    return null;
  }

  private static findRetreatStep(
    cultist: MonsterEntity,
    player: PlayerEntity,
    gridMap: GridMap,
    allMonsters: MonsterEntity[]
  ): Coordinates | null {
    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    let bestStep: Coordinates | null = null;
    let maxDist = Math.hypot(cultist.x - player.x, cultist.y - player.y);

    for (const dir of directions) {
      const nx = cultist.x + dir.x;
      const ny = cultist.y + dir.y;

      if (!gridMap.isWalkable(nx, ny)) continue;
      if (nx === player.x && ny === player.y) continue;
      if (allMonsters.some(m => m.id !== cultist.id && m.x === nx && m.y === ny)) continue;

      const d = Math.hypot(nx - player.x, ny - player.y);
      if (d > maxDist) {
        maxDist = d;
        bestStep = { x: nx, y: ny };
      }
    }

    return bestStep;
  }

  public static findNextStepAStar(
    start: Coordinates,
    goal: Coordinates,
    gridMap: GridMap,
    otherMonsters: MonsterEntity[]
  ): Coordinates | null {
    const openSet: Node[] = [];
    const closedSet = new Set<string>();

    const startNode: Node = {
      x: start.x,
      y: start.y,
      g: 0,
      h: Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y),
      f: Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y),
      parent: null,
    };
    openSet.push(startNode);

    const isBlocked = (x: number, y: number): boolean => {
      if (!gridMap.isWalkable(x, y)) return true;
      if (otherMonsters.some(m => m.x === x && m.y === y)) return true;
      return false;
    };

    while (openSet.length > 0) {
      // Find node with lowest f
      let lowestIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIndex].f) {
          lowestIndex = i;
        }
      }
      const current = openSet.splice(lowestIndex, 1)[0];
      const key = `${current.x},${current.y}`;
      closedSet.add(key);

      // Check if reached target or adjacent to target
      if (current.x === goal.x && current.y === goal.y) {
        return EntityAI.reconstructFirstStep(current);
      }

      const neighbors = [
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 },
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
      ];

      for (const neighbor of neighbors) {
        if (!gridMap.isInBounds(neighbor.x, neighbor.y)) continue;
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(neighborKey)) continue;

        // Allow moving into goal even if occupied by player
        if (neighbor.x !== goal.x || neighbor.y !== goal.y) {
          if (isBlocked(neighbor.x, neighbor.y)) continue;
        }

        const gScore = current.g + 1;
        let neighborNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

        if (!neighborNode) {
          const hScore = Math.abs(neighbor.x - goal.x) + Math.abs(neighbor.y - goal.y);
          neighborNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: gScore,
            h: hScore,
            f: gScore + hScore,
            parent: current,
          };
          openSet.push(neighborNode);
        } else if (gScore < neighborNode.g) {
          neighborNode.g = gScore;
          neighborNode.f = gScore + neighborNode.h;
          neighborNode.parent = current;
        }
      }
    }

    return null;
  }

  private static reconstructFirstStep(node: Node): Coordinates | null {
    let curr: Node = node;
    while (curr.parent && curr.parent.parent) {
      curr = curr.parent;
    }
    return { x: curr.x, y: curr.y };
  }

  public static getFacing(fromX: number, fromY: number, toX: number, toY: number): Direction {
    if (toX > fromX) return 'right';
    if (toX < fromX) return 'left';
    if (toY > fromY) return 'down';
    return 'up';
  }
}
