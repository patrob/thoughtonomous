import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef;
  private ctx!: CanvasRenderingContext2D;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private touchStartDistance = 0;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
    this.ctx = canvas.getContext('2d')!;
    this.drawGrid();
    this.setupEventListeners();
  }

  private drawGrid(): void {
    const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
    const spacing = 20 * this.scale;
    const dashLength = 2;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.strokeStyle = '#ccc';
    this.ctx.lineWidth = 1 / this.scale;

    // Draw vertical lines
    for (let x = this.offsetX % spacing; x < canvas.width; x += spacing) {
      this.ctx.beginPath();
      this.ctx.setLineDash([dashLength, dashLength]);
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, canvas.height);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = this.offsetY % spacing; y < canvas.height; y += spacing) {
      this.ctx.beginPath();
      this.ctx.setLineDash([dashLength, dashLength]);
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(canvas.width, y);
      this.ctx.stroke();
    }
  }

  private setupEventListeners(): void {
    const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;

    // Mouse events
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      console.log('mouse wheel event', e);
      if (e.ctrlKey) {
        const delta = e.deltaY < 0 ? 1.02 : 0.98;
        this.zoom(delta, e.offsetX, e.offsetY);
      } else {
        const speed = 0.2;
        const direction = e.deltaMode === 0 ? -1 : 1;
        this.offsetX += (e.deltaX * speed * direction) / this.scale;
        this.offsetY += (e.deltaY * speed * direction) / this.scale;
        this.drawGrid();
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastX = e.offsetX;
      this.lastY = e.offsetY;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.offsetX += (e.offsetX - this.lastX) / this.scale;
        this.offsetY += (e.offsetY - this.lastY) / this.scale;
        this.lastX = e.offsetX;
        this.lastY = e.offsetY;
        this.drawGrid();
      }
    });

    canvas.addEventListener('mouseup', () => (this.isDragging = false));
    canvas.addEventListener('mouseleave', () => (this.isDragging = false));

    // Touch events
    canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    canvas.addEventListener('touchend', () => this.handleTouchEnd());
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 2) {
      // Store initial distance for pinch gesture
      this.touchStartDistance = this.getTouchDistance(e);
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 2) {
      const currentDistance = this.getTouchDistance(e);
      const distanceChange = Math.abs(
        currentDistance - this.touchStartDistance
      );

      // Only zoom if there's significant pinch movement
      if (distanceChange > 10) {
        const delta = currentDistance / this.touchStartDistance;
        const midPoint = this.getTouchMidpoint(e);
        this.zoom(delta, midPoint.x, midPoint.y);
        this.touchStartDistance = currentDistance;
      } else {
        // Handle two-finger scroll
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const midPoint = this.getTouchMidpoint(e);

        this.offsetX += (midPoint.x - this.lastX) / this.scale;
        this.offsetY += (midPoint.y - this.lastY) / this.scale;
        this.lastX = midPoint.x;
        this.lastY = midPoint.y;
        this.drawGrid();
      }
    } else if (e.touches.length === 1) {
      // Handle single finger scroll
      const touch = e.touches[0];
      if (this.isDragging) {
        this.offsetX += (touch.clientX - this.lastX) / this.scale;
        this.offsetY += (touch.clientY - this.lastY) / this.scale;
        this.lastX = touch.clientX;
        this.lastY = touch.clientY;
        this.drawGrid();
      } else {
        this.isDragging = true;
        this.lastX = touch.clientX;
        this.lastY = touch.clientY;
      }
    }
  }

  private handleTouchEnd(): void {
    this.isDragging = false;
  }

  private getTouchDistance(e: TouchEvent): number {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    return Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
  }

  private getTouchMidpoint(e: TouchEvent): { x: number; y: number } {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }

  private zoom(delta: number, mouseX: number, mouseY: number): void {
    const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;

    // Calculate new scale
    const newScale = this.scale * delta;
    if (newScale < 0.1 || newScale > 10) return;

    // Calculate new offsets
    const worldMouseX = mouseX / this.scale + this.offsetX;
    const worldMouseY = mouseY / this.scale + this.offsetY;

    this.scale = newScale;
    this.offsetX = worldMouseX - mouseX / this.scale;
    this.offsetY = worldMouseY - mouseY / this.scale;

    this.drawGrid();
  }
}
