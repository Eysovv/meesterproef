const stickerScene = document.querySelector(".price-scene");
const stickerLayer = document.querySelector(".sticker-layer");
const stickerSrc = "price-sticker-2.png";
const hero = document.querySelector(".hero-audio");
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

if (hero) {
  hero.addEventListener("pointerenter", () => hero.classList.add("is-hovered"));
  hero.addEventListener("pointerleave", () => hero.classList.remove("is-hovered"));
  hero.addEventListener("focusin", () => hero.classList.add("is-hovered"));
  hero.addEventListener("focusout", () => hero.classList.remove("is-hovered"));
}

function setupScrollAudio(zones, audio) {
  const zoneList = Array.isArray(zones) ? zones.filter(Boolean) : [zones].filter(Boolean);
  if (!zoneList.length || !audio) return;

  const maxVolume = Number(audio.dataset.volume || 0.72);
  audio.volume = 0;
  audio.loop = true;
  audio.muted = true;

  let targetVolume = 0;
  let fadeFrame = null;
  const visibleZones = new Set();

  const keepWarm = () => {
    const attempt = audio.play();
    if (attempt) attempt.catch(() => {});
  };

  const fadeAudio = (volume) => {
    targetVolume = volume;
    cancelAnimationFrame(fadeFrame);

    const step = () => {
      const delta = targetVolume - audio.volume;
      if (Math.abs(delta) < 0.015) {
        audio.volume = targetVolume;
        if (targetVolume === 0) audio.muted = true;
        return;
      }

      audio.volume = clamp(audio.volume + delta * 0.07, 0, maxVolume);
      fadeFrame = requestAnimationFrame(step);
    };

    if (targetVolume > 0) {
      audio.muted = false;
      const playAttempt = audio.play();
      if (playAttempt) {
        playAttempt
          .then(step)
          .catch(() => {
            targetVolume = 0;
            audio.muted = true;
          });
      }
    } else {
      step();
    }
  };

  keepWarm();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleZones.add(entry.target);
        } else {
          visibleZones.delete(entry.target);
        }
      });
      fadeAudio(visibleZones.size ? maxVolume : 0);
    },
    { threshold: 0.22 }
  );

  zoneList.forEach((zone) => observer.observe(zone));
}

setupScrollAudio(document.querySelector(".hero-audio"), document.querySelector(".nursery-audio"));
setupScrollAudio([...document.querySelectorAll(".bunker-zone")], document.querySelector(".bunker-audio"));

if (stickerScene && stickerLayer) {
  let lastSticker = 0;
  stickerScene.addEventListener("pointermove", (event) => {
    const now = performance.now();
    if (now - lastSticker < 105) return;
    lastSticker = now;

    const bounds = stickerScene.getBoundingClientRect();
    const sticker = document.createElement("img");
    sticker.src = stickerSrc;
    sticker.alt = "";
    sticker.className = "price-sticker";
    sticker.style.left = `${event.clientX - bounds.left}px`;
    sticker.style.top = `${event.clientY - bounds.top}px`;
    sticker.style.setProperty("--rot", `${Math.random() * 28 - 14}deg`);
    stickerLayer.append(sticker);

    const stickers = stickerLayer.querySelectorAll(".price-sticker");
    if (stickers.length > 18) stickers[0].remove();
  });

  stickerScene.addEventListener("pointerleave", () => {
    setTimeout(() => stickerLayer.replaceChildren(), 500);
  });
}

function updateBelts() {
  document.querySelectorAll(".belt-stage").forEach((stage) => {
    const strip = stage.querySelector(".belt-babies");
    if (!strip) return;
    const rect = stage.getBoundingClientRect();
    const progress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);
    const distance = Math.max(window.innerWidth * 0.78, 620);
    const direction = stage.dataset.direction === "left" ? -1 : 1;
    const offset = (progress - 0.5) * distance * direction;
    strip.style.transform = `translateX(${offset}px)`;
  });
}

window.addEventListener("scroll", updateBelts, { passive: true });
window.addEventListener("resize", updateBelts);
updateBelts();

const stories = {
  karina: {
    title: "Karina",
    image: "frame-7.png",
    text: "Karina is tweeëntwintig. Ze komt uit Bachmoet, een stad die tot puin werd gebombardeerd. Ze week uit naar Kiev, vond geen vast werk. In een winkel, met net genoeg voor brood en luiers voor haar dochtertje, besloot ze het te doen. Ze draagt nu een kind van een echtpaar dat ze nooit zal ontmoeten. Eén van een tweeling overleed in haar buik; haar loon werd verlaagd, zo stond het in het contract. Niemand dwingt ons, zegt ze. Dit is mijn lichaam, mijn beslissing. Ze wil er zoveel doen als haar lichaam toelaat. In ieder geval genoeg om een huis van te kopen."
  },
  wei: {
    title: "Wei",
    image: "weithumb.png",
    text: "Wei werd te vroeg geboren, met hersenschade. De ouders die hem hadden besteld, hoorden ervan en kwamen niet. Ze verdwenen; niemand kreeg ze nog te pakken. Hij is nu vijf. Hij kan niet zitten, zijn hoofd niet houden, niet goed zien. Hij woont in een tehuis in Kiev en eet er elke dag met dezelfde kinderen. Vijftien gezinnen bekeken zijn dossier. Niemand wilde hem."
  }
};

const dialog = document.querySelector(".story-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogText = document.querySelector(".dialog-text");
const dialogMedia = document.querySelector(".dialog-media");

document.querySelectorAll(".portrait-card").forEach((card) => {
  card.addEventListener("click", () => {
    const story = stories[card.dataset.story];
    if (!story || !dialog) return;
    dialogTitle.textContent = story.title;
    dialogText.textContent = story.text;
    dialogMedia.style.backgroundImage = `url("${story.image}")`;
    dialog.showModal();
  });
});

document.querySelector(".close-dialog")?.addEventListener("click", () => dialog.close());
dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

const babies = [...document.querySelectorAll(".game-baby")];
const slots = [...document.querySelectorAll(".crib-slot")];
const shuffleButton = document.querySelector(".shuffle-button");
const result = document.querySelector(".game-result");
let draggedBaby = null;

function homeForBaby(baby) {
  return document.querySelector(`.baby-start[data-home="${baby.dataset.baby}"]`);
}

function moveBabyHome(baby) {
  homeForBaby(baby)?.append(baby);
}

function resetGame() {
  babies.forEach((baby, index) => {
    moveBabyHome(baby);
    baby.style.setProperty("--jump-a", index === 0 ? "190px" : "-190px");
    baby.style.setProperty("--jump-b", index === 0 ? "-120px" : "120px");
    baby.classList.add("is-shuffling");
    setTimeout(() => baby.classList.remove("is-shuffling"), 1650);
  });

  if (Math.random() > 0.5) {
    slots[0].dataset.accept = "b";
    slots[1].dataset.accept = "a";
  } else {
    slots[0].dataset.accept = "a";
    slots[1].dataset.accept = "b";
  }

  result.textContent = "De rij is gehusseld. Sleep de twee baby’s naar de wiegjes.";
}

function checkGame() {
  const placed = slots.every((slot) => slot.querySelector(".game-baby"));
  if (!placed) return;
  const correct = slots.every((slot) => slot.querySelector(".game-baby")?.dataset.baby === slot.dataset.accept);
  result.textContent = correct
    ? "Goed gelegd."
    : "Verkeerde bak.";
}

babies.forEach((baby) => {
  baby.addEventListener("dragstart", (event) => {
    draggedBaby = baby;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", baby.dataset.baby);
  });
});

slots.forEach((slot) => {
  slot.addEventListener("dragover", (event) => {
    event.preventDefault();
    slot.classList.add("is-over");
  });

  slot.addEventListener("dragleave", () => {
    slot.classList.remove("is-over");
  });

  slot.addEventListener("drop", (event) => {
    event.preventDefault();
    slot.classList.remove("is-over");
    const baby = draggedBaby || document.querySelector(`[data-baby="${event.dataTransfer.getData("text/plain")}"]`);
    if (!baby) return;
    const existingBaby = slot.querySelector(".game-baby");
    if (existingBaby && existingBaby !== baby) {
      moveBabyHome(existingBaby);
    }
    slot.append(baby);
    checkGame();
  });
});

shuffleButton?.addEventListener("click", resetGame);
resetGame();
