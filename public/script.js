gsap.registerPlugin(ScrollTrigger);

/* REVEAL ANIMAÇÕES */
gsap.utils.toArray(".reveal").forEach((el)=>{
gsap.from(el,{
opacity:0,
y:80,
duration:1.2,
scrollTrigger:{
trigger:el,
start:"top 85%"
}
})
});

/* HERO CINEMÁTICO */
gsap.from(".hero-content",{
opacity:0,
y:100,
duration:1.5
});

gsap.from(".hero-image img",{
scale:1.2,
opacity:0,
duration:2
});

/* CONTAGEM REGRESSIVA */
const targetDate = new Date("April 12, 2026 20:00:00").getTime();

function animateNumber(id,value){
const el = document.getElementById(id);

gsap.fromTo(el,
{y:-8, opacity:0},
{y:0, opacity:1, duration:0.4}
);

el.innerText = value < 10 ? "0"+value : value;
}

setInterval(()=>{
const now = new Date().getTime();
const distance = targetDate - now;

if(distance <= 0) return;

const days = Math.floor(distance/(1000*60*60*24));
const hours = Math.floor((distance%(1000*60*60*24))/(1000*60*60));
const minutes = Math.floor((distance%(1000*60*60))/(1000*60));
const seconds = Math.floor((distance%(1000*60))/1000);

animateNumber("days",days);
animateNumber("hours",hours);
animateNumber("minutes",minutes);
animateNumber("seconds",seconds);

},1000);

/* ESCASSEZ DINÂMICA */
let spots = 40;
setInterval(()=>{
if(spots>12){
spots--;
document.getElementById("spots").innerText = spots;
}
},15000);
// ANIMAÇÃO RISCO 599
ScrollTrigger.create({
trigger: ".old-price",
start: "top 85%",
onEnter: () => {
document.querySelector(".old-price").classList.add("animate");
}
});
// PARTICULAS SUAVES
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];

class Particle{
constructor(){
this.x = Math.random() * canvas.width;
this.y = Math.random() * canvas.height;
this.size = Math.random() * 2;
this.speedX = (Math.random() - 0.5) * 0.5;
this.speedY = (Math.random() - 0.5) * 0.5;
}

update(){
this.x += this.speedX;
this.y += this.speedY;

if(this.x > canvas.width || this.x < 0){
this.speedX *= -1;
}
if(this.y > canvas.height || this.y < 0){
this.speedY *= -1;
}
}

draw(){
ctx.fillStyle = "rgba(0,255,246,0.4)";
ctx.beginPath();
ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
ctx.fill();
}
}

function initParticles(){
particlesArray = [];
for(let i=0;i<70;i++){
particlesArray.push(new Particle());
}
}

function animateParticles(){
ctx.clearRect(0,0,canvas.width,canvas.height);
particlesArray.forEach(p=>{
p.update();
p.draw();
});
requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

window.addEventListener("resize",()=>{
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
});

async function pagar() {
  try {

    const res = await fetch("/criar-pagamento", {
      method: "POST"
    });

    const data = await res.json();

    //salva no navegador
    localStorage.setItem("preference_id", data.preferenceId);
    window.location.href = data.url;

  } catch (err) {
    alert("Erro ao iniciar pagamento");
    console.error(err);
  }
}