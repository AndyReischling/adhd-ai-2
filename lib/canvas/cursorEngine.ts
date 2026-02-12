import { AgentCursor, CanvasAsset } from '@/types';

// Agent home positions (scaled to workspace)
const agentHomePositions: Record<string, { x: number; y: number }> = {
  boris: { x: 200, y: 120 },
  nadia: { x: 500, y: 160 },
  gremlin: { x: 350, y: 80 },
  'the-archivist': { x: 650, y: 100 },
  'comrade-pixel': { x: 820, y: 140 },
};

export class CursorEngine {
  private cursors: AgentCursor[];
  private assets: CanvasAsset[];
  private frameId: number | null = null;
  private time: number = 0;
  private workspaceWidth: number = 1000;
  private workspaceHeight: number = 600;
  private destroyed: boolean = false;
  // Direct DOM refs for each cursor — avoids React re-renders at 60fps
  private domRefs: Map<string, HTMLElement> = new Map();

  constructor(initialCursors: AgentCursor[]) {
    this.cursors = initialCursors.map((c) => {
      const home = agentHomePositions[c.agentId] ?? { x: 400, y: 200 };
      return { ...c, position: { ...home }, targetPosition: { ...home } };
    });
    this.assets = [];
  }

  /** Register a DOM element for direct position updates */
  registerCursorElement(agentId: string, el: HTMLElement | null) {
    if (el) {
      this.domRefs.set(agentId, el);
    } else {
      this.domRefs.delete(agentId);
    }
  }

  setWorkspaceSize(w: number, h: number) {
    this.workspaceWidth = w;
    this.workspaceHeight = h;
  }

  setAssets(assets: CanvasAsset[]) {
    this.assets = assets;
  }

  getCursors(): AgentCursor[] {
    return this.cursors;
  }

  setCursorState(agentId: string, state: AgentCursor['state'], targetPos?: { x: number; y: number }) {
    const cursor = this.cursors.find((c) => c.agentId === agentId);
    if (cursor) {
      cursor.state = state;
      if (targetPos) {
        cursor.targetPosition = { ...targetPos };
      }
    }
  }

  private getAssignedAsset(agentId: string): CanvasAsset | undefined {
    const agentAssets = this.assets.filter((a) => a.createdBy === agentId);
    return agentAssets[agentAssets.length - 1];
  }

  private getDiscussionCenter(): { x: number; y: number } {
    return { x: this.workspaceWidth * 0.4, y: this.workspaceHeight * 0.35 };
  }

  private getHomePosition(agentId: string): { x: number; y: number } {
    const home = agentHomePositions[agentId] || { x: 400, y: 200 };
    const scaleX = this.workspaceWidth / 1000;
    const scaleY = this.workspaceHeight / 600;
    return { x: home.x * scaleX, y: home.y * scaleY };
  }

  private clampToWorkspace(pos: { x: number; y: number }): { x: number; y: number } {
    return {
      x: Math.max(20, Math.min(this.workspaceWidth - 60, pos.x)),
      y: Math.max(20, Math.min(this.workspaceHeight - 60, pos.y)),
    };
  }

  tick = () => {
    if (this.destroyed) return;
    this.time += 1;

    for (const cursor of this.cursors) {
      const agentSeed = cursor.agentId.charCodeAt(0) * 0.7 + (cursor.agentId.charCodeAt(1) || 0) * 0.3;
      const t = this.time * 0.016;
      const home = this.getHomePosition(cursor.agentId);

      switch (cursor.state) {
        case 'idle': {
          const wanderRadius = 80;
          cursor.targetPosition = this.clampToWorkspace({
            x: home.x + Math.sin(t * 0.3 + agentSeed) * wanderRadius + Math.cos(t * 0.17 + agentSeed * 2) * wanderRadius * 0.5,
            y: home.y + Math.cos(t * 0.25 + agentSeed) * wanderRadius * 0.6 + Math.sin(t * 0.12 + agentSeed * 3) * wanderRadius * 0.3,
          });
          break;
        }
        case 'working': {
          const asset = this.getAssignedAsset(cursor.agentId);
          if (asset) {
            const cx = asset.position.x + asset.width / 2;
            const cy = asset.position.y + asset.height / 2;
            cursor.targetPosition = this.clampToWorkspace({
              x: cx + Math.sin(t * 2.5 + agentSeed) * 25 + (Math.random() - 0.5) * 8,
              y: cy + Math.cos(t * 2.0 + agentSeed) * 18 + (Math.random() - 0.5) * 6,
            });
          } else {
            cursor.targetPosition = this.clampToWorkspace({
              x: home.x + Math.sin(t * 1.5 + agentSeed) * 40 + (Math.random() - 0.5) * 10,
              y: home.y + Math.cos(t * 1.2 + agentSeed) * 30 + (Math.random() - 0.5) * 8,
            });
          }
          break;
        }
        case 'discussing': {
          const center = this.getDiscussionCenter();
          const cursorIndex = this.cursors.indexOf(cursor);
          const angleOffset = cursorIndex * ((Math.PI * 2) / this.cursors.length);
          const orbitRadius = 90 + cursorIndex * 15;
          cursor.targetPosition = this.clampToWorkspace({
            x: center.x + Math.cos(t * 0.15 + angleOffset) * orbitRadius,
            y: center.y + Math.sin(t * 0.15 + angleOffset) * orbitRadius * 0.7,
          });
          break;
        }
        case 'reviewing': {
          const scanY = home.y + Math.sin(t * 0.2 + agentSeed) * 50;
          const scanX = (this.workspaceWidth * 0.15) + ((t * 20 + agentSeed * 100) % (this.workspaceWidth * 0.7));
          cursor.targetPosition = this.clampToWorkspace({ x: scanX, y: scanY });
          break;
        }
        case 'creating': {
          cursor.targetPosition = this.clampToWorkspace({
            x: cursor.targetPosition.x + (Math.random() - 0.5) * 3,
            y: cursor.targetPosition.y + (Math.random() - 0.5) * 2,
          });
          break;
        }
      }

      const lerpFactor = cursor.state === 'creating' ? 0.04 : cursor.state === 'working' ? 0.06 : 0.05;
      cursor.position = {
        x: cursor.position.x + (cursor.targetPosition.x - cursor.position.x) * lerpFactor,
        y: cursor.position.y + (cursor.targetPosition.y - cursor.position.y) * lerpFactor,
      };

      // Update DOM directly — no React state update
      const el = this.domRefs.get(cursor.agentId);
      if (el) {
        el.style.transform = `translate(${cursor.position.x}px, ${cursor.position.y}px)`;
      }
    }

    this.frameId = requestAnimationFrame(this.tick);
  };

  start() {
    if (!this.frameId && !this.destroyed) {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  stop() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  destroy() {
    this.destroyed = true;
    this.stop();
    this.domRefs.clear();
  }
}
