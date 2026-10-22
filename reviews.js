const REVIEW_API = "https://txwhkspbiauzlnvfvvzq.supabase.co/rest/v1/reviews";
const REVIEW_KEY = "sb_publishable_xArIlN5UMN28xofNHpeUOQ_aRz6b2Tk";
const reviewHeaders = { apikey: REVIEW_KEY, Authorization: "Bearer " + REVIEW_KEY };
const list = document.getElementById("reviews-list");
const form = document.getElementById("review-form");
const toggle = document.getElementById("review-toggle");
const feedback = document.getElementById("review-feedback");
const starsInput = document.getElementById("review-stars");
const ratingInput = document.getElementById("review-rating");
const starButtons = [...starsInput.querySelectorAll("button")];
function setRating(value) {
  const rating = Math.max(1, Math.min(5, value));
  ratingInput.value = String(rating);
  starButtons.forEach((button, index) => {
    button.classList.toggle("selected", index < rating);
    button.setAttribute("aria-pressed", String(index + 1 === rating));
  });
}
function ratingFromPointer(event) {
  const rect = starsInput.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width - 1, event.clientX - rect.left));
  return Math.min(5, Math.floor(x / rect.width * 5) + 1);
}
let draggingStars = false;
starsInput.addEventListener("pointerdown", event => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  draggingStars = true;
  starsInput.setPointerCapture(event.pointerId);
  setRating(ratingFromPointer(event));
  event.preventDefault();
});
starsInput.addEventListener("pointermove", event => {
  if (draggingStars) setRating(ratingFromPointer(event));
});
function stopDragging() { draggingStars = false; }
starsInput.addEventListener("pointerup", stopDragging);
starsInput.addEventListener("pointercancel", stopDragging);
starButtons.forEach(button => {
  button.addEventListener("click", () => setRating(Number(button.dataset.rating)));
  button.addEventListener("keydown", event => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") { event.preventDefault(); setRating(Number(ratingInput.value) + 1); }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") { event.preventDefault(); setRating(Number(ratingInput.value) - 1); }
  });
});
setRating(5);
toggle.addEventListener("click", () => {
  form.hidden = !form.hidden;
  toggle.setAttribute("aria-expanded", String(!form.hidden));
  if (!form.hidden) form.querySelector("input").focus();
});
async function loadReviews() {
  try {
    const response = await fetch(REVIEW_API + "?select=name,rating,comment,created_at&approved=eq.true&order=created_at.desc&limit=12", {headers: reviewHeaders});
    if (!response.ok) throw new Error("load");
    const reviews = await response.json();
    list.replaceChildren();
    if (!reviews.length) {
      const empty = document.createElement("p");
      empty.className = "reviews-muted";
      empty.textContent = "Još nema objavljenih recenzija. Budite prvi koji će podeliti mišljenje!";
      list.append(empty);
      return;
    }
    for (const review of reviews) {
      const card = document.createElement("article");
      card.className = "review-card";
      const stars = document.createElement("div");
      stars.className = "review-card-stars";
      stars.textContent = "★".repeat(review.rating) + "☆".repeat(5-review.rating);
      const comment = document.createElement("p");
      comment.textContent = "„" + review.comment + "“";
      const name = document.createElement("strong");
      name.textContent = review.name;
      card.append(name, comment, stars);
      list.append(card);
    }
  } catch {
    list.textContent = "Recenzije trenutno nisu dostupne. Pokušajte ponovo kasnije.";
  }
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const comment = String(data.get("comment") || "").trim();
  const rating = Number(data.get("rating"));
  if (!/^\S+\s+\S+/.test(name) || name.length > 60 || comment.length < 10 || comment.length > 1000 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    feedback.textContent = "Proverite unete podatke."; return;
  }
  button.disabled = true;
  feedback.textContent = "Slanje...";
  try {
    const response = await fetch(REVIEW_API, {
      method: "POST",
      headers: {...reviewHeaders, "Content-Type": "application/json", Prefer: "return=minimal"},
      body: JSON.stringify({name, rating, comment})
    });
    if (!response.ok) throw new Error("submit");
    form.reset();
    setRating(5);
    feedback.textContent = "Hvala na vašem mišljenju! Recenzija će biti objavljena nakon provere.";
  } catch {
    feedback.textContent = "Slanje nije uspelo. Pokušajte ponovo.";
  } finally {
    button.disabled = false;
  }
});
loadReviews();
