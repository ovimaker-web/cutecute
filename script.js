const partySymbols = ['🌸', '🌼', '🌻', '🌷', '⭐', '💖', '✨', '🎈', '⚡'];
const partyBg = document.getElementById('partyBg');

let bgInterval = setInterval(() => {
    const item = document.createElement('div');
    item.classList.add('party-item');
    item.innerText = partySymbols[Math.floor(Math.random() * partySymbols.length)];
    item.style.left = Math.random() * 100 + 'vw';
    item.style.animationDuration = (Math.random() * 2 + 2) + 's';
    partyBg.appendChild(item);
    setTimeout(() => { item.remove(); }, 3500);
}, 160);

function bigBoom() {
    const colors = ['#ff69b4', '#ffeb3b', '#00bcd4', '#9c27b0', '#ff9800', '#4caf50'];
    for (let i = 0; i < 45; i++) {
        const particle = document.createElement('div');
        particle.classList.add('fw-particle');
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = window.innerWidth / 2 + 'px';
        particle.style.top = window.innerHeight / 2 + 'px';

        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * 180 + 40;
        particle.style.setProperty('--dx', `${Math.cos(angle) * force}px`);
        particle.style.setProperty('--dy', `${Math.sin(angle) * force}px`);

        document.body.appendChild(particle);
        setTimeout(() => { particle.remove(); }, 700);
    }
}

let fullScreenFireworksInterval = null;

function startFullScreenFireworks() {
    const overlay = document.getElementById('fireworkOverlay');
    overlay.style.display = 'block';
    const colors = ['#ff69b4', '#ffeb3b', '#00bcd4', '#9c27b0', '#ff9800', '#4caf50', '#ffffff'];

    fullScreenFireworksInterval = setInterval(() => {
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;

        for (let i = 0; i < 25; i++) {
            const p = document.createElement('div');
            p.classList.add('fw-particle');
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.left = startX + 'px';
            p.style.top = startY + 'px';

            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 120 + 30;
            p.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
            p.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);

            overlay.appendChild(p);
            setTimeout(() => { p.remove(); }, 800);
        }
    }, 300);
}

function stopFullScreenFireworks() {
    const overlay = document.getElementById('fireworkOverlay');
    overlay.style.display = 'none';
    if (fullScreenFireworksInterval) {
        clearInterval(fullScreenFireworksInterval);
    }
}

function nextPage(pageNum) {
    document.querySelectorAll('.card').forEach(card => card.classList.remove('active'));
    document.getElementById('page' + pageNum).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pageNum === 8) {
        startFullScreenFireworks();
    } else {
        stopFullScreenFireworks();
    }
}

let yesClickCount = 0;
const yesBtn = document.getElementById('yesBtn');

function handleYesClick() {
    yesClickCount++;
    if (yesClickCount <= 3) {
        const randomX = (Math.random() - 0.5) * 120;
        const randomY = (Math.random() - 0.5) * 50;
        yesBtn.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${(Math.random() - 0.5) * 15}deg)`;
    } else if (yesClickCount === 4) {
        yesBtn.innerText = "Sabaaaar dong saayaaang... 🤭";
        yesBtn.style.transform = "translate(0px, 0px) rotate(0deg)";
    } else {
        yesBtn.innerText = "MAU BANGET!!! 💖";
        bigBoom();
        nextPage(2);
    }
}

const noBtn = document.getElementById('noBtn');
const phrases = ["Eits, gak bisa! 😜", "Pilih 'Mau' aja wlee!", "Tombol salah alamat!", "Dih, ngelak ya! 🤭", "Kejar dlu boss!"];

function moveNoButton() {
    const x = Math.random() * (window.innerWidth - noBtn.offsetWidth - 100);
    const y = Math.random() * (window.innerHeight - noBtn.offsetHeight - 100);
    noBtn.style.position = 'fixed';
    noBtn.style.left = `${Math.max(20, x)}px`;
    noBtn.style.top = `${Math.max(20, y)}px`;
    noBtn.innerText = phrases[Math.floor(Math.random() * phrases.length)];
}

function selectOption(option) {
    const mainDestImg = document.getElementById('mainDestImg');
    const destDescription = document.getElementById('destDescription');
    const itineraryTitle = document.getElementById('itineraryTitle');
    const itineraryList = document.getElementById('itineraryList');

    if (option === 1) {
        mainDestImg.src = "https://media.21cineplex.com/webcontent/gallery/pictures/151306025460468_1024x669.jpg";
        destDescription.innerText = "Main games di Funworld Alam Sutera, santai sore sepoi-sepoi di The Breeze BSD, ditutup nonton bioskop XXI The Breeze! 🎮🍃🍿";
        
        itineraryTitle.innerText = "🎮 Vibe: Funworld Alsut & The Breeze";
        itineraryList.innerHTML = `
            <li>13:00 - Penjemputan Sefti tercinta berangkat ke Alsut 🚗</li>
            <li>14:00 - Seru-seruan main games di Funworld Alam Sutera 🎯</li>
            <li>16:30 - Santai sore & kulineran asyik di The Breeze BSD 🍃</li>
            <li>19:00 - Nonton film santai di bioskop XXI The Breeze 🍿✨</li>
        `;
    } else if (option === 2) {
        mainDestImg.src = "https://storage.googleapis.com/arsitagx-master/img-small/19329/15893/design-donk-sushi-hiro-plaza-indonesia1600685704-s.jpeg";
        destDescription.innerText = "Makan sushi sama aku, lanjut jalan jalan dan foto-foto estetik di Museum Macan! 🍣🎨📸";
        
        itineraryTitle.innerText = "🍣 Vibe: Sushi & Art Date";
        itineraryList.innerHTML = `
            <li>12:30 - Penjemputan dengan senyuman manis 🥰</li>
            <li>13:00 - Foto-foto estetik di Museum Macan 🎨📸</li>
            <li>15:00 - Makan siang sushi terenak penambah energi 🍣</li>
            <li>18:30 - Pulang dengan hati gembira & perut kenyang 💖</li>
            
        `;
    } else if (option === 3) {
        mainDestImg.src = "https://dte.telkomuniversity.ac.id/wp-content/uploads/2025/06/62dec6809a479.jpg";
        destDescription.innerText = "Roadtrip seru berdua keliling Bandung, nikmati udara dingin, pemandangan indah, dan kulineran! ⛰️🚗💨";
        
        itineraryTitle.innerText = "⛰️ Vibe: Bandung Roadtrip";
        itineraryList.innerHTML = `
            <li>08:00 - Berangkat pagi roadtrip seru ke Bandung 🚗💨</li>
            <li>11:00 - Tiba di kota Bandung 🌲</li>
            <li>13:30 - Kulineran makanan enak khas Bandung 🍜</li>
            <li>17:00 - Perjalanan pulang 🎶</li>
        `;
    }
    nextPage(3);
}