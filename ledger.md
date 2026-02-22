ledger.md

pg gradient color
background: linear-gradient(135deg, #feeaf8, #71d8ff, #ff89cf);

<!-- pg my tasks bg -->

background:
linear-gradient(
135deg,
rgba(255, 107, 107, 0.22),
rgba(255, 217, 61, 0.22),
rgba(107, 255, 154, 0.22),
rgba(107, 180, 255, 0.22),
rgba(195, 107, 255, 0.22)
),
rgba(255, 255, 255, 0.9);
border-color: transparent;
box-shadow:
0 0 0 2px rgba(255, 255, 255, 0.7),
0 0 0 4px rgba(255, 124, 203, 0.35);

<!-- for pg mode hover tab buttons! -->

.task-tab-btn.active {
border-color: #d21ccf;
color: #000000;
box-shadow: inset 0 -2px 0 #801cd2;
}

body .tab-content h2,
body .timer-setup-title {
background: linear-gradient(120deg, #5a67f2, #c14dcc, #33a8d8, #6a4bdc);
-webkit-background-clip: text;
background-clip: text;
color: transparent;
text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}

#F894C8
#FEC67C
#FBE662
#76CEE0
#72C4DE
#DEB1E1

border: var(--group-card-border-width) solid transparent;
background:
var(--group-card-wash-layer) padding-box,
var(--group-card-image-layer) padding-box,
var(--card-rainbow-border) border-box;
box-shadow: var(--group-card-shadow);

stats cards?

Animated gradient border

<div class="box">{children}</div>
.box {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  height: 400px;
  width: 400px;
  border: 3px solid #0000;
  border-radius: 12px;
  background: linear-gradient(#131219, #131219) padding-box, linear-gradient(
        var(--angle),
        #070707,
        #687aff
      ) border-box;
  animation: 8s rotate linear infinite;
}

@keyframes rotate {
to {
--angle: 360deg;
}
}

@property --angle {
syntax: "<angle>";
initial-value: 0deg;
inherits: false;
}

If you prefer using Tailwind CSS, here's the equivalent code written with React and TypeScript:

export const AnimatedGradientBorderTW: React.FC<{
children: React.ReactNode;
}> = ({ children }) => {
const boxRef = useRef<HTMLDivElement>(null);

useEffect(() => {
const boxElement = boxRef.current;

    if (!boxElement) {
      return;
    }

    const updateAnimation = () => {
      const angle =
        (parseFloat(boxElement.style.getPropertyValue("--angle")) + 0.5) % 360;
      boxElement.style.setProperty("--angle", `${angle}deg`);
      requestAnimationFrame(updateAnimation);
    };

    requestAnimationFrame(updateAnimation);

}, []);

return (
<div
ref={boxRef}
style={
{
"--angle": "0deg",
"--border-color": "linear-gradient(var(--angle), #070707, #687aff)",
"--bg-color": "linear-gradient(#131219, #131219)",
} as CSSProperties
}
className="flex h-[400px] w-[400px] items-center justify-center rounded-lg border-2 border-[#0000] p-3 [background:padding-box_var(--bg-color),border-box_var(--border-color)]" >
{children}
</div>
);
};
In this implementation, we handle the animation using JavaScript. We utilize the requestAnimationFrame function to update the custom property --angle every 16ms (60fps).

CSS Pseudo-Elements
If you want to support more browsers, you can use the following method instead:

.box\_\_bg {
position: relative;
z-index: 0;
height: 400px;
width: 400px;
border-radius: 12px;
overflow: hidden;
padding: 12px;
}

.box\_\_bg::before {
content: "";
position: absolute;
z-index: -2;
left: -50%;
top: -50%;
width: 200%;
height: 200%;
background-color: #000;
background-repeat: no-repeat;
background-size: 100%100%, 50%50%;
background-position: 0 0, 100% 0, 100% 100%, 0 100%;
background-image: linear-gradient(#070707, #687aff);
animation: bgRotate 4s linear infinite;
}

.box\_\_bg::after {
content: "";
position: absolute;
z-index: -1;
left: 1px;
top: 1px;
width: calc(100% - 2px);
height: calc(100% - 2px);
background: linear-gradient(#06021d, #06021d);
border-radius: 12px;
}

@keyframes bgRotate {
100% {
transform: rotate(1turn);
}
}
