// --- Firebase/Authentication Placeholder ---
        // In a real application, data persistence would be set up here.
        // For this client-side simulation, we will use local variables.

        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const statusMessage = document.getElementById('status-message');
        const calculateBtn = document.getElementById('calculate-btn');
        const resetBtn = document.getElementById('reset-btn');

        let points = [];
        let route = [];
        let calculatedDistance = 0; // Variable to store the resulting route distance
        const POINT_RADIUS = 8;
        const DEPOT_COLOR = '#ff0000'; // Red
        const DELIVERY_COLOR = '#0d9488'; // Teal
        const ROUTE_COLOR = '#ffcc00'; // Yellow

        // --- Core Functions ---

        /**
         * Calculates the Euclidean distance between two points.
         * @param {object} p1 - Point 1 {x, y}
         * @param {object} p2 - Point 2 {x, y}
         * @returns {number} Distance
         */
        function distance(p1, p2) {
            return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        }

        /**
         * Implements the Nearest Neighbor Approximation Algorithm for TSP.
         * @returns {object} {path: array, totalDistance: number}
         */
        function nearestNeighborTSP() {
            if (points.length < 2) return { path: [], totalDistance: 0 };

            const unvisited = new Set(points.map((_, i) => i));
            const path = [];
            let totalDistance = 0;

            // Start at the first point (Depot)
            let currentIdx = 0;
            path.push(points[currentIdx]);
            unvisited.delete(currentIdx);

            while (unvisited.size > 0) {
                let nearestIdx = -1;
                let minDistance = Infinity;

                // Find the nearest unvisited neighbor
                for (const nextIdx of unvisited) {
                    const dist = distance(points[currentIdx], points[nextIdx]); 
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestIdx = nextIdx;
                    }
                }

                if (nearestIdx !== -1) {
                    currentIdx = nearestIdx;
                    path.push(points[currentIdx]);
                    unvisited.delete(currentIdx);
                    totalDistance += minDistance;
                }
            }

            // Return to the depot (closing the loop)
            const finalDistance = distance(path[path.length - 1], path[0]);
            path.push(path[0]);
            totalDistance += finalDistance;

            return { path, totalDistance };
        }
        
        /**
         * Draws an arrowhead at the midpoint of a line segment, pointing towards (x2, y2).
         * @param {CanvasRenderingContext2D} ctx - The canvas context.
         * @param {number} x1 - Start X.
         * @param {number} y1 - Start Y.
         * @param {number} x2 - End X.
         * @param {number} y2 - End Y.
         */
        function drawArrowhead(ctx, x1, y1, x2, y2) {
            const size = 12; // Size of the arrow head
            // Calculate angle of the line segment
            const angle = Math.atan2(y2 - y1, x2 - x1);
            
            // Calculate midpoint of the line segment for placement
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            ctx.fillStyle = ROUTE_COLOR;
            ctx.beginPath();
            
            // Move to the midpoint (which acts as the arrow tip)
            ctx.moveTo(midX, midY);
            
            // Draw left wing (using angle +/- Math.PI/7 for a defined arrow shape)
            ctx.lineTo(
                midX - size * Math.cos(angle - Math.PI / 7),
                midY - size * Math.sin(angle - Math.PI / 7)
            );
            
            // Draw right wing
            ctx.lineTo(
                midX - size * Math.cos(angle + Math.PI / 7),
                midY - size * Math.sin(angle + Math.PI / 7)
            );
            
            ctx.closePath();
            ctx.fill();
        }

        /**
         * Draws the points and the calculated route on the canvas.
         */
        function draw() {
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw the route (if calculated)
            if (route.length > 1) {
                // Draw the connecting dashed lines
                ctx.beginPath();
                ctx.strokeStyle = ROUTE_COLOR;
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 5]); // Dashed line for route
                ctx.moveTo(route[0].x, route[0].y);

                for (let i = 1; i < route.length; i++) {
                    ctx.lineTo(route[i].x, route[i].y);
                }
                ctx.stroke();
                ctx.setLineDash([]); // Reset line dash
                
                // Draw the direction arrows
                for (let i = 0; i < route.length - 1; i++) {
                    const p1 = route[i];
                    const p2 = route[i + 1];
                    drawArrowhead(ctx, p1.x, p1.y, p2.x, p2.y);
                }
            }

            // 2. Draw the points and labels
            points.forEach((p, index) => {
                const isDepot = index === 0;
                const color = isDepot ? DEPOT_COLOR : DELIVERY_COLOR;
                const label = isDepot ? 'Depot' : `P${index}`;

                // Draw circle
                ctx.beginPath();
                ctx.arc(p.x, p.y, POINT_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Draw label
                ctx.fillStyle = '#f9f9f9'; // White text
                ctx.font = '14px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(label, p.x, p.y - 15);
            });
        }

        /**
         * Handles point addition on click/tap.
         * @param {number} clientX
         * @param {number} clientY
         */
        function addPoint(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            // Simple boundary check
            if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
                points.push({ x, y });
                route = []; // Clear route on new point addition
                calculatedDistance = 0; // Reset distance
                updateUI();
                draw();
            }
        }

        /**
         * Updates buttons and status message based on current state.
         */
        function updateUI() {
            const count = points.length;
            statusMessage.textContent = `Current Points: ${count}`;

            if (count > 0 && route.length > 0) {
                // Now using the dedicated variable: calculatedDistance
                statusMessage.textContent = `Route Calculated. Distance: ${calculatedDistance.toFixed(0)} units.`;
            } else if (count >= 2) {
                statusMessage.textContent = `Current Points: ${count}. Ready to calculate route.`;
            }

            calculateBtn.disabled = count < 3; // Need Depot + 2 stops minimum
        }

        /**
         * Resizes the canvas to match its container element.
         */
        function resizeCanvas() {
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = Math.max(container.clientHeight, 400); // Minimum height for visibility
            draw();
        }

        // --- Event Listeners ---

        window.addEventListener('load', () => {
            resizeCanvas();
        });
        window.addEventListener('resize', resizeCanvas);

        canvas.addEventListener('click', (e) => {
            addPoint(e.clientX, e.clientY);
        });

        calculateBtn.addEventListener('click', () => {
            if (points.length >= 3) {
                const result = nearestNeighborTSP();
                route = result.path;
                calculatedDistance = result.totalDistance; // Assigning to the global variable
                updateUI();
                draw();
            }
        });

        resetBtn.addEventListener('click', () => {
            points = [];
            route = [];
            calculatedDistance = 0; // Resetting the global variable
            updateUI();
            draw();
        });

        // Initialize with default setup
        window.onload = () => {
            resizeCanvas();
            updateUI();
        };