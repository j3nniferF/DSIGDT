/**
 * Lightweight confetti animation library
 * Creates celebratory confetti animation without external dependencies
 */

class ConfettiGenerator {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
    }

    /**
     * Trigger confetti animation
     * @param {number} duration - Duration in milliseconds
     */
    celebrate(duration = 3000) {
        this.createCanvas();
        this.generateParticles(50);
        this.animate();

        // Clean up after duration
        setTimeout(() => {
            this.stop();
        }, duration);
    }

    /**
     * Create and append canvas to body
     */
    createCanvas() {
        if (this.canvas) return;

        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9999';
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Generate confetti particles
     * @param {number} count - Number of particles to generate
     */
    generateParticles(count) {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: -10,
                size: Math.random() * 8 + 4,
                speedY: Math.random() * 3 + 2,
                speedX: Math.random() * 4 - 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5
            });
        }
    }

    /**
     * Animation loop
     */
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((particle, index) => {
            // Update position
            particle.y += particle.speedY;
            particle.x += particle.speedX;
            particle.rotation += particle.rotationSpeed;
            particle.speedY += 0.1; // Gravity

            // Draw particle
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation * Math.PI / 180);
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
            this.ctx.restore();

            // Remove particles that are off-screen
            if (particle.y > this.canvas.height) {
                this.particles.splice(index, 1);
            }
        });

        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.stop();
        }
    }

    /**
     * Stop animation and clean up
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
            this.ctx = null;
        }
        this.particles = [];
    }
}

// Create global instance
const confetti = new ConfettiGenerator();
