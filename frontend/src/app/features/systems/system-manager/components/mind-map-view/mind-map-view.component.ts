import {
  Component, Input, OnChanges, SimpleChanges,
  AfterViewInit, ElementRef, ViewChild, OnDestroy
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { PhaseNode, MindMapNode } from '../../system-manager.types';
import * as d3 from 'd3';

@Component({
  selector: 'app-mind-map-view',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="bg-white rounded-lg shadow-gentle border border-taupe/10 overflow-hidden">
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-3 p-4 border-b border-taupe/10 bg-alabaster">
        <span class="text-xs font-bold uppercase tracking-wider text-taupe">Mind Map View</span>
        <div class="flex-1"></div>
        <div class="flex items-center gap-2">
          <button
            (click)="zoomIn()"
            class="h-9 w-9 rounded-lg bg-sand border border-taupe/20 inline-flex items-center justify-center text-charcoal hover:bg-sand-dark transition-colors">
            <span class="material-symbols-outlined text-base">zoom_in</span>
          </button>
          <button
            (click)="zoomOut()"
            class="h-9 w-9 rounded-lg bg-sand border border-taupe/20 inline-flex items-center justify-center text-charcoal hover:bg-sand-dark transition-colors">
            <span class="material-symbols-outlined text-base">zoom_out</span>
          </button>
          <button
            (click)="resetZoom()"
            class="h-9 w-9 rounded-lg bg-sand border border-taupe/20 inline-flex items-center justify-center text-charcoal hover:bg-sand-dark transition-colors">
            <span class="material-symbols-outlined text-base">fit_screen</span>
          </button>
          <button
            (click)="expandAll()"
            class="inline-flex items-center gap-1.5 bg-sand border border-taupe/20 rounded-lg px-3 py-2 text-xs font-bold text-charcoal hover:bg-sand-dark transition-colors">
            <span class="material-symbols-outlined text-sm">unfold_more</span> Expand
          </button>
          <button
            (click)="collapseAll()"
            class="inline-flex items-center gap-1.5 bg-sand border border-taupe/20 rounded-lg px-3 py-2 text-xs font-bold text-charcoal hover:bg-sand-dark transition-colors">
            <span class="material-symbols-outlined text-sm">unfold_less</span> Collapse
          </button>
        </div>
      </div>

      <!-- SVG Canvas -->
      <div class="relative" style="height: 600px; overflow: hidden;">
        <div #svgContainer class="w-full h-full"></div>

        <!-- Legend -->
        <div class="absolute bottom-4 left-4 flex items-center gap-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-taupe/10 shadow-gentle text-xs font-bold">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-orange-500"></span>
            System
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-sage"></span>
            Phase
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-blue-500"></span>
            Week
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-taupe"></span>
            Task
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class MindMapViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef<HTMLDivElement>;

  @Input() hierarchy: PhaseNode[] = [];
  @Input() systemTitle = 'System';

  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private treeData: MindMapNode | null = null;
  private isInitialized = false;

  private readonly colors: Record<string, string> = {
    system: '#f97316',
    phase: '#8c9a81',
    week: '#3b82f6',
    task: '#9a9086'
  };

  private readonly nodeRadius: Record<string, number> = {
    system: 28,
    phase: 20,
    week: 14,
    task: 8
  };

  ngAfterViewInit() {
    this.initializeSvg();
    this.isInitialized = true;
    if (this.hierarchy?.length) {
      this.render();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['hierarchy'] || changes['systemTitle']) && this.isInitialized) {
      this.render();
    }
  }

  ngOnDestroy() {
    // Clean up SVG
    if (this.svg) {
      this.svg.remove();
    }
  }

  /* ── SVG initialization ─────────────────────────────────────── */

  private initializeSvg() {
    const container = this.svgContainer.nativeElement;
    const width = container.clientWidth || 900;
    const height = 600;

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('font-family', 'Cabin, sans-serif');

    // Defs for gradients / markers
    const defs = this.svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#d4cfc9');

    this.g = this.svg.append('g');

    this.zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);
  }

  /* ── Build tree data from hierarchy ─────────────────────────── */

  private buildTreeData(): MindMapNode {
    return {
      name: this.systemTitle || 'System',
      type: 'system',
      children: (this.hierarchy || []).map(phase => ({
        name: phase.name || 'Phase',
        type: 'phase' as const,
        meta: phase.objective,
        children: phase.weeks.map(week => ({
          name: `W${week.weekNum}: ${week.focus || 'Week'}`,
          type: 'week' as const,
          meta: week.goal,
          children: week.items.map(item => ({
            name: item.title || 'Task',
            type: 'task' as const,
            meta: `Day ${item.day_number}`
          }))
        }))
      }))
    };
  }

  /* ── Render tree ────────────────────────────────────────────── */

  private render() {
    if (!this.g) return;

    this.treeData = this.buildTreeData();

    // Clear previous
    this.g.selectAll('*').remove();

    const container = this.svgContainer.nativeElement;
    const width = container.clientWidth || 900;
    const height = 600;

    const root = d3.hierarchy<MindMapNode>(this.treeData);
    const treeLayout = d3.tree<MindMapNode>()
      .size([height - 80, width - 220])
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.8));

    treeLayout(root);

    // Links
    this.g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('d', (d: any) => {
        return `M${d.source.y + 110},${d.source.x + 40}
                C${(d.source.y + d.target.y) / 2 + 110},${d.source.x + 40}
                 ${(d.source.y + d.target.y) / 2 + 110},${d.target.x + 40}
                 ${d.target.y + 110},${d.target.x + 40}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#e8e0d8')
      .attr('stroke-width', 2)
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .attr('opacity', 1);

    // Nodes
    const nodes = this.g.selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y + 110},${d.x + 40})`)
      .attr('opacity', 0)
      .style('cursor', 'pointer');

    nodes.transition()
      .duration(600)
      .delay((_, i) => i * 40)
      .attr('opacity', 1);

    // Circles
    nodes.append('circle')
      .attr('r', (d) => this.nodeRadius[d.data.type] || 10)
      .attr('fill', (d) => this.colors[d.data.type] || '#999')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

    // Labels
    nodes.append('text')
      .attr('dy', (d) => d.data.type === 'task' ? '0.35em' : '-1.6em')
      .attr('x', (d) => d.data.type === 'task' ? 14 : 0)
      .attr('text-anchor', (d) => d.data.type === 'task' ? 'start' : 'middle')
      .attr('fill', '#4a443e')
      .attr('font-size', (d) => {
        switch (d.data.type) {
          case 'system': return '14px';
          case 'phase': return '12px';
          case 'week': return '11px';
          case 'task': return '10px';
          default: return '11px';
        }
      })
      .attr('font-weight', (d) => d.data.type === 'task' ? '500' : '700')
      .text((d) => {
        const timeStr = d.data.meta && d.data.type === 'task' ? ` (${d.data.meta})` : '';
        const name = d.data.name + timeStr;
        const maxLen = d.data.type === 'task' ? 35 : 20;
        return name.length > maxLen ? name.slice(0, maxLen) + '…' : name;
      });

    // Meta labels (smaller text below)
    nodes.filter((d) => !!d.data.meta && d.data.type !== 'task')
      .append('text')
      .attr('dy', '-0.4em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#9a9086')
      .attr('font-size', '9px')
      .text((d) => {
        const meta = d.data.meta || '';
        return meta.length > 30 ? meta.slice(0, 30) + '…' : meta;
      });

    // Hover effect
    nodes.on('mouseover', function () {
      d3.select(this).select('circle')
        .transition().duration(200)
        .attr('r', function () {
          return parseFloat(d3.select(this).attr('r')) * 1.3;
        });
    })
    .on('mouseout', function () {
      d3.select(this).select('circle')
        .transition().duration(200)
        .attr('r', function () {
          return parseFloat(d3.select(this).attr('r')) / 1.3;
        });
    });

    // Auto-fit
    this.resetZoom();
  }

  /* ── Zoom Controls ──────────────────────────────────────────── */

  zoomIn() {
    this.svg.transition().duration(300).call(this.zoom.scaleBy, 1.3);
  }

  zoomOut() {
    this.svg.transition().duration(300).call(this.zoom.scaleBy, 0.7);
  }

  resetZoom() {
    if (!this.svg) return;
    const container = this.svgContainer.nativeElement;
    const width = container.clientWidth || 900;
    const height = 600;
    this.svg.transition().duration(500).call(
      this.zoom.transform,
      d3.zoomIdentity.translate(20, 0).scale(0.85)
    );
  }

  expandAll() {
    // Re-render with full tree
    this.render();
  }

  collapseAll() {
    // Re-render showing only phases
    if (!this.g || !this.treeData) return;
    const collapsed: MindMapNode = {
      ...this.treeData,
      children: this.treeData.children?.map(phase => ({
        ...phase,
        children: [] // collapse weeks
      }))
    };

    this.g.selectAll('*').remove();

    const container = this.svgContainer.nativeElement;
    const width = container.clientWidth || 900;
    const height = 600;

    const root = d3.hierarchy<MindMapNode>(collapsed);
    const treeLayout = d3.tree<MindMapNode>()
      .size([height - 80, width - 220])
      .separation((a, b) => 2);

    treeLayout(root);

    // Links
    this.g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('d', (d: any) =>
        `M${d.source.y + 110},${d.source.x + 40}
         C${(d.source.y + d.target.y) / 2 + 110},${d.source.x + 40}
          ${(d.source.y + d.target.y) / 2 + 110},${d.target.x + 40}
          ${d.target.y + 110},${d.target.x + 40}`)
      .attr('fill', 'none')
      .attr('stroke', '#e8e0d8')
      .attr('stroke-width', 2);

    // Nodes
    const nodes = this.g.selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y + 110},${d.x + 40})`)
      .style('cursor', 'pointer');

    nodes.append('circle')
      .attr('r', (d) => this.nodeRadius[d.data.type] || 10)
      .attr('fill', (d) => this.colors[d.data.type] || '#999')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

    nodes.append('text')
      .attr('dy', '-1.6em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#4a443e')
      .attr('font-size', (d) => d.data.type === 'system' ? '14px' : '12px')
      .attr('font-weight', '700')
      .text((d) => d.data.name);

    // Click to expand
    nodes.on('click', (event: any, d: any) => {
      if (d.data.type === 'phase' || d.data.type === 'system') {
        this.render(); // expand all
      }
    });

    this.resetZoom();
  }
}
