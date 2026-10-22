const REVIEW_API = "https://txwhkspbiauzlnvfvvzq.supabase.co/rest/v1/reviews";
const REVIEW_KEY = "sb_publishable_xArIlN5UMN28xofNHpeUOQ_aRz6b2Tk";
const reviewHeaders = { apikey: REVIEW_KEY, Authorization: "Bearer " + REVIEW_KEY };
const list = document.getElementById("reviews-list");
const form = document.getElementById("review-form");
const toggle = document.getElementById("review-toggle");
const feedback = document.getElementById("review-feedback");
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
      card.append(stars, comment, name);
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
  if (name.length < 2 || name.length > 60 || comment.length < 10 || comment.length > 1000 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
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
    feedback.textContent = "Hvala na vašem mišljenju! Recenzija će biti objavljena nakon provere.";
  } catch {
    feedback.textContent = "Slanje nije uspelo. Pokušajte ponovo.";
  } finally {
    button.disabled = false;
  }
});
loadReviews();
