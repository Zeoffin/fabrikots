import React, { useState, useRef, useEffect } from 'react';

interface Props {
    lastMessage: any;
}

interface WheelAction {
    id: string;
    label: string;
    color: string;
}

const getRandomHSL = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 30) + 60; // 60-90% saturation for vibrant colors
  const lightness = Math.floor(Math.random() * 20) + 35; // 35-55% lightness for good contrast with white
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const WHEEL_ACTIONS: WheelAction[] = [
    { id: 'mute_3_rounds', label: 'Tev mute on discord for 3 rounds', color: getRandomHSL() },
    { id: 'mute_3_rounds', label: 'Kādam citam mute on discord uz 4 rounds', color: getRandomHSL() },
    { id: 'no_effect', label: 'Nu neko nedabūji', color: getRandomHSL() },
    { id: 'add_5_points', label: '+5 punkti', color: getRandomHSL() },
    { id: 'add_5_points', label: '+1 punkti', color: getRandomHSL() },
    { id: 'add_5_points', label: '+3 punkti', color: getRandomHSL() },
    { id: 'remove_1_point', label: '-1 punkts', color: getRandomHSL() },
    { id: 'remove_10_point', label: '-10 punkti', color: getRandomHSL() },
    { id: 'remove_3_point', label: '-3 punkti', color: getRandomHSL() },
    { id: 'swap_points', label: 'Punktu Maiņa', color: getRandomHSL() },
    { id: 'no_effect', label: 'Nu neko nedabūji', color: getRandomHSL() },
];

const WheelDisplay: React.FC<Props> = ({ lastMessage }) => {
    const [showWheel, setShowWheel] = useState(false);
    const [targetUser, setTargetUser] = useState('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedAction, setSelectedAction] = useState<WheelAction | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (lastMessage) {
            const messageData = JSON.parse(lastMessage["data"]);
            
            if (messageData["type"] === "wheelspin_start") {
                setTargetUser(messageData["target_user"]);
                setShowWheel(true);
                setIsSpinning(true);
                // removed setSpinResult(null);
                setSelectedAction(null);
                
                // Use server-provided spin parameters for synchronized animation
                const finalRotation = messageData["final_rotation"];
                const spinDuration = messageData["spin_duration"];
                const selectedAction = messageData["selected_action"];
                
                // Start synchronized spinning animation
                setTimeout(() => {
                    spinWheelWithParams(finalRotation, spinDuration, selectedAction);
                }, 100);
            }
            
            if (messageData["type"] === "wheelspin_result") {
                const action = WHEEL_ACTIONS.find(a => a.id === messageData["action"]);
                if (action) {
                    setSelectedAction(action);
                    // removed setSpinResult(`${action.label}`);
                    setIsSpinning(false);
                    
                    // Hide wheel after showing result
                    setTimeout(() => {
                        setShowWheel(false);
                        // removed setSpinResult(null);
                        setSelectedAction(null);
                        setTargetUser('');
                    }, 5000);
                }
            }
        }
    }, [lastMessage]);

    const drawWheel = (rotation = 0) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const anglePerSection = (2 * Math.PI) / WHEEL_ACTIONS.length;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw wheel sections
        WHEEL_ACTIONS.forEach((action, index) => {
            const startAngle = index * anglePerSection + rotation;
            const endAngle = (index + 1) * anglePerSection + rotation;

            // Draw section
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = action.color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text properly wrapped in each section
            const textAngle = startAngle + anglePerSection / 2;
            const textX = centerX + Math.cos(textAngle) * (radius * 0.75);
            const textY = centerY + Math.sin(textAngle) * (radius * 0.75);

            ctx.save();
            ctx.translate(textX, textY);
            ctx.rotate(textAngle + Math.PI / 2);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Wrap text to fit in the wheel section
            const words = action.label.split(' ');
            const maxWidth = radius * 0.4; // Maximum width for text
            const lineHeight = 16;
            let lines = [];
            let currentLine = '';
            
            for (let word of words) {
                const testLine = currentLine + word + ' ';
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && currentLine !== '') {
                    lines.push(currentLine.trim());
                    currentLine = word + ' ';
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine.trim());
            
            // Draw each line of text
            const totalHeight = lines.length * lineHeight;
            const startY = -(totalHeight / 2) + (lineHeight / 2);
            
            for (let i = 0; i < lines.length; i++) {
                const y = startY + (i * lineHeight);
                ctx.fillText(lines[i], 0, y);
            }
            
            ctx.restore();
        });

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
        ctx.fillStyle = '#333333';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw HUGE, VISIBLE RED POINTER on the RIGHT side
        ctx.beginPath();
        ctx.moveTo(centerX + radius + 10, centerY);  // Start just outside wheel edge
        ctx.lineTo(centerX + radius + 80, centerY - 50);  // Top point - much larger
        ctx.lineTo(centerX + radius + 80, centerY + 50);  // Bottom point - much larger
        ctx.closePath();
        ctx.fillStyle = '#FF0000';  // Bright red
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;  // Much thicker border
        ctx.stroke();
        
        // Add a huge yellow rectangle for extra visibility
        ctx.fillStyle = '#FFFF00';  // Yellow rectangle
        ctx.fillRect(centerX + radius + 100, centerY - 40, 60, 80);  // Much larger
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeRect(centerX + radius + 100, centerY - 40, 60, 80);
    };

    const spinWheelWithParams = (finalRotation: number, spinDuration: number, serverSelectedAction: any) => {
        const startTime = Date.now();
        const initialRotation = 0;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            // Ease-out animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentRotation = initialRotation + finalRotation * easeOut;

            drawWheel(currentRotation);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Calculate which section the RIGHT side pointer is pointing to
                // The pointer is now on the right side (90 degrees / π/2)
                let normalizedRotation = currentRotation % (2 * Math.PI);
                if (normalizedRotation < 0) normalizedRotation += 2 * Math.PI;
                
                const anglePerSection = (2 * Math.PI) / WHEEL_ACTIONS.length;
                
                // Since the pointer is on the right side (0 degrees in our coordinate system)
                // and sections are drawn starting from 0 degrees clockwise
                // No offset needed - right side is 0 degrees
                const adjustedAngle = normalizedRotation;
                const sectionIndex = Math.floor(adjustedAngle / anglePerSection) % WHEEL_ACTIONS.length;
                
                const visualAction = WHEEL_ACTIONS[sectionIndex];
                
                // Use the visual action that the pointer is actually pointing to
                setSelectedAction(visualAction);
                // removed setSpinResult(visualAction.label);
                setIsSpinning(false);
                
                // Debug log to check alignment
                console.log('Final rotation:', currentRotation);
                console.log('Normalized rotation:', normalizedRotation);
                console.log('Adjusted angle (with right pointer offset):', adjustedAngle);
                console.log('Section index:', sectionIndex);
                console.log('Visual action:', visualAction?.label);
                console.log('Server action:', serverSelectedAction.label);
                
                // Auto-hide after showing result
                setTimeout(() => {
                    setShowWheel(false);
                    // removed setSpinResult(null);
                    setSelectedAction(null);
                    setTargetUser('');
                }, 4000);
            }
        };

        animate();
    };

    const closeWheel = () => {
        setShowWheel(false);
        // removed setSpinResult(null);
        setSelectedAction(null);
        setTargetUser('');
        setIsSpinning(false);
    };

    useEffect(() => {
        if (showWheel && canvasRef.current) {
            drawWheel();
        }
    }, [showWheel]);

    if (!showWheel) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <button
                onClick={closeWheel}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    color: 'white',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                ×
            </button>

            <h2 style={{
                color: 'rgba(0, 255, 170, 0.9)',
                marginBottom: '2rem',
                fontSize: '2rem',
                textAlign: 'center'
            }}>
                Spinning for {targetUser}!
            </h2>

            <canvas
                ref={canvasRef}
                width={500}
                height={500}
                style={{
                    border: '3px solid rgba(0, 255, 170, 0.5)',
                    borderRadius: '50%',
                    boxShadow: '0 0 30px rgba(0, 255, 170, 0.3)'
                }}
            />

            {selectedAction && !isSpinning && (
                <div style={{
                    marginTop: '2rem',
                    padding: '1rem 2rem',
                    background: selectedAction.color,
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
                }}>
                    {selectedAction.label}
                </div>
            )}
        </div>
    );
};

export default WheelDisplay;