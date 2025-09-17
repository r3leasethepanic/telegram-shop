/* =======================
   ГАЛЕРЕЯ / КАРУСЕЛЬ
======================= */
const GALLERY_IMAGES = [
  "pics/g1.jpg",
  "pics/g2.jpg",
  "pics/g3.jpg",
  "pics/g4.jpg",
  "pics/g5.jpg"
];

/* =======================
   ТОВАРЫ
======================= */
const products = [
  { id: 1, title: "Колье", desc: "Красивое колье.", price: 2500, images: ["pics/necklace1.jpg","pics/necklace2.jpg","pics/necklace3.jpg"], category: "necklace", variants: [{ id: "length", label: "Длина колье", options: ["40 см", "50 см"] }] },
  { id: 2, title: "Серьги", desc: "Серебряные серьги.", price: 1500, images: ["pics/earrings1.jpg","pics/earrings2.jpg"], category: "earrings" },
  { id: 3, title: "Брошь", desc: "Элегантная брошь.", price: 1800, images: ["pics/brooch1.jpg","pics/brooch2.jpg"], category: "brooches" },
  { id: 4, title: "Аксессуар", desc: "Модный аксессуар.", price: 1200, images: ["pics/accessory1.jpg","pics/accessory2.jpg"], category: "accessories" },
  { id: 5, title: "Жемчужное сияние", desc: "Колье с пресноводным жемчугом.", price: 3200, images: ["pics/necklace1.jpg","pics/necklace2.jpg"], category: "necklace", variants: [{ id: "length", label: "Длина колье", options: ["40 см", "50 см"] }] },
  { id: 6, title: "Золотой луч", desc: "Минималистичное колье с позолоченным покрытием.", price: 2900, images: ["pics/necklace2.jpg","pics/necklace3.jpg"], category: "necklace", variants: [{ id: "length", label: "Длина колье", options: ["40 см", "50 см"] }] },
  { id: 7, title: "Ночная заря", desc: "Контрастное колье с тёмными камнями и кристаллами.", price: 3400, images: ["pics/necklace3.jpg","pics/necklace1.jpg"], category: "necklace", variants: [{ id: "length", label: "Длина колье", options: ["40 см", "50 см"] }] }
];

/* =======================
   СОСТОЯНИЕ
======================= */
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let orders = JSON.parse(localStorage.getItem("orders") || "[]");
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let currentCategory = null;
let currentProductId = null;
let currentProductVariants = {};
let checkoutModalEl = null;
let checkoutFormEl = null;
let checkoutErrorEl = null;
let checkoutTotalEl = null;
let checkoutAddressGroupEl = null;
let checkoutSubmitBtn = null;
let checkoutDeliveryInputs = [];
let checkoutPaymentInputs = [];

normalizeCart();

/* =======================
   УТИЛИТЫ
======================= */
function save() {
  localStorage.setItem("cart", JSON.stringify(cart));
  localStorage.setItem("orders", JSON.stringify(orders));
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function toast(_) { /* отключено */ }

function normalizeCart() {
  cart = (cart || []).map(item => {
    const product = products.find(p => p.id === item.id) || {};
    const selections = (item.selectedOptions || []).reduce((acc, opt) => {
      acc[opt.id] = opt.value;
      return acc;
    }, {});
    let variantKey = item.variantKey || buildVariantKey(item.id, selections);

    if ((!item.selectedOptions || !item.selectedOptions.length) && product.variants && product.variants.length) {
      const keyPayload = (variantKey || "").split(":")[1] || "";
      if (keyPayload && keyPayload !== "default") {
        keyPayload.split("|").forEach(pair => {
          const [k, v] = pair.split("=");
          if (k && v) selections[k] = v;
        });
      }
    }

    if (!variantKey) {
      variantKey = buildVariantKey(item.id, selections);
    }

    const selectedOptions = (item.selectedOptions && item.selectedOptions.length)
      ? item.selectedOptions
      : getVariantSummary(product, selections);

    return {
      id: item.id,
      title: item.title || product.title || "",
      price: item.price || product.price || 0,
      images: item.images || product.images || [],
      image: item.image || product.image || (product.images ? product.images[0] : ""),
      qty: item.qty || 1,
      variantKey,
      selectedOptions: selectedOptions || []
    };
  });
}

function getProductById(id) {
  return products.find(p => p.id === id);
}

function ensureVariantSelections(product, source = {}) {
  const selections = {};
  if (!product || !product.variants || !product.variants.length) return selections;
  product.variants.forEach(variant => {
    const value = source[variant.id] || currentProductVariants[variant.id] || variant.options[0];
    currentProductVariants[variant.id] = value;
    selections[variant.id] = value;
  });
  return selections;
}

function normalizeVariantSelections(product, selections = {}) {
  const normalized = {};
  if (!product || !product.variants || !product.variants.length) return normalized;
  product.variants.forEach(variant => {
    normalized[variant.id] = selections[variant.id] || variant.options[0];
  });
  return normalized;
}

function buildVariantKey(productId, selections) {
  const entries = Object.entries(selections || {});
  if (!entries.length) return `${productId}:default`;
  entries.sort(([a], [b]) => a.localeCompare(b));
  return `${productId}:${entries.map(([k, v]) => `${k}=${v}`).join("|")}`;
}

function getVariantSummary(product, selections) {
  if (!product || !product.variants || !product.variants.length) return [];
  return product.variants.map(variant => ({
    id: variant.id,
    label: variant.label,
    value: selections[variant.id] || variant.options[0]
  }));
}

function findCartItem(productId, variantKey) {
  return cart.find(item => item.id === productId && item.variantKey === variantKey);
}

/* =======================
   ВСПОМОГАТЕЛЬНЫЕ КАРУСЕЛИ
======================= */
function setupScrollableCarousel({ carousel, trackSelector, prevSelector = ".prev", nextSelector = ".next", onChange }) {
  const track = carousel.querySelector(trackSelector);
  const slides = track ? Array.from(track.children) : [];
  if (!track || slides.length === 0) return null;

  const total = slides.length;
  const prevBtn = carousel.querySelector(prevSelector);
  const nextBtn = carousel.querySelector(nextSelector);
  let raf = null;

  const getWidth = () => slides[0]?.getBoundingClientRect().width || track.clientWidth || 1;

  const goTo = (idx) => {
    const width = getWidth();
    const targetIndex = Math.max(0, Math.min(total - 1, idx));
    track.scrollTo({ left: targetIndex * width, behavior: "smooth" });
  };

  const notify = () => {
    if (!onChange) return;
    const width = getWidth();
    const current = width ? Math.round(track.scrollLeft / width) : 0;
    onChange(current, total, { prevBtn, nextBtn });
  };

  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      notify();
    });
  };

  track.addEventListener("scroll", schedule, { passive: true });

  if (prevBtn) {
    prevBtn.style.display = total > 1 ? "" : "none";
    if (total > 1) {
      prevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const width = getWidth();
        const current = width ? Math.round(track.scrollLeft / width) : 0;
        goTo(current - 1);
      });
    }
  }

  if (nextBtn) {
    nextBtn.style.display = total > 1 ? "" : "none";
    if (total > 1) {
      nextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const width = getWidth();
        const current = width ? Math.round(track.scrollLeft / width) : 0;
        goTo(current + 1);
      });
    }
  }

  notify();

  return {
    goTo,
    destroy() {
      track.removeEventListener("scroll", schedule);
    }
  };
}

function formatDelivery(value) {
  if (value === "pickup") return "Самовывоз";
  if (value === "courier") return "Курьер";
  return "-";
}

function formatPayment(value) {
  if (value === "cash") return "Наличными при получении";
  if (value === "card") return "Картой сейчас";
  return "-";
}

function getSelectedRadio(inputs) {
  const checked = inputs.find(input => input.checked);
  return checked ? checked.value : null;
}

function openCheckoutModal() {
  if (!checkoutModalEl || cart.length === 0) return;
  if (checkoutErrorEl) {
    checkoutErrorEl.style.display = "none";
    checkoutErrorEl.textContent = "";
  }
  updateCheckoutUI();
  checkoutModalEl.classList.add("open");
  checkoutModalEl.setAttribute("aria-hidden", "false");
}

function closeCheckoutModal() {
  if (!checkoutModalEl) return;
  checkoutModalEl.classList.remove("open");
  checkoutModalEl.setAttribute("aria-hidden", "true");
}

function updateCheckoutUI() {
  if (!checkoutFormEl) return;
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (checkoutTotalEl) checkoutTotalEl.textContent = `${total} ₽`;

  const delivery = getSelectedRadio(checkoutDeliveryInputs) || "courier";
  const payment = getSelectedRadio(checkoutPaymentInputs) || "card";

  if (checkoutSubmitBtn) checkoutSubmitBtn.textContent = payment === "card" ? "Оплатить" : "Заказать";

  if (checkoutAddressGroupEl) {
    const addressInput = checkoutAddressGroupEl.querySelector("input");
    if (delivery === "courier") {
      checkoutAddressGroupEl.style.display = "flex";
      checkoutAddressGroupEl.style.flexDirection = "column";
      if (addressInput) addressInput.required = true;
    } else {
      checkoutAddressGroupEl.style.display = "none";
      if (addressInput) {
        addressInput.required = false;
      }
    }
  }
}

function handleCheckoutDeliveryChange() {
  updateCheckoutUI();
}

function handleCheckoutPaymentChange() {
  updateCheckoutUI();
}

function handleCheckoutSubmit(event) {
  event.preventDefault();
  if (!checkoutFormEl) return;

  const formData = new FormData(checkoutFormEl);
  const name = (formData.get("name") || "").trim();
  const phone = (formData.get("phone") || "").trim();
  const delivery = formData.get("delivery") || "courier";
  const payment = formData.get("payment") || "card";
  let address = (formData.get("address") || "").trim();

  if (!name) return showCheckoutError("Введите имя");
  if (!phone) return showCheckoutError("Введите телефон");
  if (delivery === "courier" && !address) return showCheckoutError("Укажите адрес доставки");
  if (delivery !== "courier") address = "";

  showCheckoutError("");
  completeCheckout({ name, phone, delivery, address, payment });
  checkoutFormEl.reset();
  updateCheckoutUI();
  closeCheckoutModal();
}

function showCheckoutError(message) {
  if (!checkoutErrorEl) return;
  if (!message) {
    checkoutErrorEl.style.display = "none";
    checkoutErrorEl.textContent = "";
  } else {
    checkoutErrorEl.style.display = "block";
    checkoutErrorEl.textContent = message;
  }
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  if (id !== "product") currentProductId = null;

  document.querySelectorAll(".tabbar button").forEach(b => b.classList.remove("active"));
  if (id === "menu") document.getElementById("tab-menu").classList.add("active");
  if (id === "catalog" || id === "category-page" || id === "product") document.getElementById("tab-catalog").classList.add("active");
  if (id === "cart") document.getElementById("tab-cart").classList.add("active");
  if (id === "orders") document.getElementById("tab-orders").classList.add("active");

  if (id === "cart") renderCart();
  if (id === "orders") renderOrders();
}

/* =======================
   КАТАЛОГ
======================= */
function openCategory(cat) {
  currentCategory = cat;

  const titleMap = {
    necklace: "Украшения на шею",
    earrings: "Серьги",
    brooches: "Броши",
    accessories: "Аксессуары"
  };
  const titleEl = document.getElementById("category-title");
  if (titleEl) titleEl.textContent = titleMap[cat] || "Категория";

  const productsDiv = document.getElementById("category-products");
  productsDiv.innerHTML = "";
  const filtered = products.filter(p => p.category === cat);

  if (filtered.length === 0) {
    productsDiv.innerHTML = `<p style="color:#888">Нет товаров</p>`;
  } else {
    filtered.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";

      const images = p.images && p.images.length ? p.images : [p.image];
      const carouselItems = images.map(src => `<img src="${src}" alt="${p.title}">`).join("");

      card.innerHTML = `
        <div class="product-carousel">
          <div class="product-carousel-track">${carouselItems}</div>
          <button class="carousel-nav prev">‹</button>
          <button class="carousel-nav next">›</button>
        </div>
        <div class="product-info">
          <h3>${p.title}</h3>
          <p><b>${p.price} ₽</b></p>
        </div>
      `;

      card.addEventListener("click", () => openProduct(p.id));
      productsDiv.appendChild(card);
    });
    initProductCarousels();
  }

  showScreen("category-page");
}

function initProductCarousels() {
  document.querySelectorAll(".product-carousel").forEach(carousel => {
    setupScrollableCarousel({ carousel, trackSelector: ".product-carousel-track" });
  });
}

/* =======================
   ТОВАР
======================= */
function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  currentProductId = id;
  currentProductVariants = {};

  const card = document.getElementById("product-card");
  const images = p.images && p.images.length ? p.images : [p.image];
  const carouselItems = images.map(src => `<img src="${src}" alt="${p.title}">`).join("");

  card.innerHTML = `
    <div class="big-carousel">
      <div class="big-carousel-track">${carouselItems}</div>
      <button class="carousel-nav prev">‹</button>
      <button class="carousel-nav next">›</button>
    </div>
    <div class="product-page-info">
      <h3>${p.title}</h3>
      <p class="product-price"><b>${p.price} ₽</b></p>
      <div class="product-variants" id="product-variants"></div>
      <p class="product-desc">${p.desc}</p>
    </div>
  `;

  renderProductVariants(p);
  renderProductAction(p.id);
  initBigCarousel();

  const favBtn = document.getElementById("product-fav-btn");
  if (favBtn) {
    favBtn.onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(p.id);
    };
    updateFavoriteButton(p.id);
  }

  showScreen("product");
}

function renderProductVariants(product) {
  const host = document.getElementById("product-variants");
  if (!host) return;

  host.innerHTML = "";

  if (!product.variants || !product.variants.length) {
    host.style.display = "none";
    return;
  }

  host.style.display = "block";

  const selections = ensureVariantSelections(product, currentProductVariants);

  product.variants.forEach(variant => {
    const currentValue = selections[variant.id] || variant.options[0];
    currentProductVariants[variant.id] = currentValue;

    const group = document.createElement("div");
    group.className = "variant-group";

    const label = document.createElement("div");
    label.className = "variant-label";
    label.textContent = `${variant.label}:`;

    const options = document.createElement("div");
    options.className = "variant-options";

    variant.options.forEach(option => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "variant-btn";
      btn.textContent = option;
      if (currentValue === option) btn.classList.add("active");
      btn.addEventListener("click", () => {
        currentProductVariants[variant.id] = option;
        renderProductVariants(product);
        renderProductAction(product.id);
      });
      options.appendChild(btn);
    });

    group.appendChild(label);
    group.appendChild(options);
    host.appendChild(group);
  });
}

function renderProductAction(productId) {
  const host = document.getElementById("product-action");
  if (!host) return;

  const product = getProductById(productId);
  if (!product) return;

  const selections = ensureVariantSelections(product, currentProductVariants);
  const variantKey = buildVariantKey(productId, selections);
  const cartItem = findCartItem(productId, variantKey);

  host.innerHTML = `<button class="shop-btn" id="product-add-btn"></button>`;
  const btn = document.getElementById("product-add-btn");

  if (!cartItem) {
    btn.textContent = "Добавить в корзину";
    btn.classList.remove("in-cart");
    btn.onclick = () => {
      addToCart(productId, { ...selections });
      renderProductAction(productId);
    };
  } else {
    btn.classList.add("in-cart");
    btn.innerHTML = `
      <span class="counter-btn" id="pa-minus">−</span>
      <span class="counter-qty">${cartItem.qty}</span>
      <span class="counter-btn" id="pa-plus">+</span>
    `;
    document.getElementById("pa-minus").onclick = (e) => {
      e.stopPropagation();
      changeQty(productId, -1, variantKey);
      renderProductAction(productId);
    };
    document.getElementById("pa-plus").onclick = (e) => {
      e.stopPropagation();
      changeQty(productId, 1, variantKey);
      renderProductAction(productId);
    };
  }
}

function initBigCarousel() {
  document.querySelectorAll(".big-carousel").forEach(carousel => {
    setupScrollableCarousel({ carousel, trackSelector: ".big-carousel-track" });
  });
}

/* =======================
   ИЗБРАННОЕ
======================= */
function isFavorite(productId) {
  return favorites.includes(productId);
}

function updateFavoriteButton(productId) {
  const btn = document.getElementById("product-fav-btn");
  if (!btn) return;

  if (isFavorite(productId)) {
    btn.classList.add("active");
  } else {
    btn.classList.remove("active");
  }
}

function toggleFavorite(productId) {
  if (isFavorite(productId)) {
    favorites = favorites.filter(id => id !== productId);
  } else {
    favorites.push(productId);
  }
  updateFavoriteButton(productId);
  save();
}

/* =======================
   КОРЗИНА
======================= */
function addToCart(id, variantSelections) {
  const product = getProductById(id);
  if (!product) return;

  const selections = normalizeVariantSelections(product, variantSelections || {});
  const variantKey = buildVariantKey(id, selections);
  let item = findCartItem(id, variantKey);

  if (item) {
    item.qty++;
  } else {
    const summary = getVariantSummary(product, selections);
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      images: product.images || [],
      image: product.image || (product.images ? product.images[0] : ""),
      qty: 1,
      variantKey,
      selectedOptions: summary
    });
  }

  save();
  updateCartCounter();

  if (document.getElementById("cart")?.classList.contains("active")) {
    renderCart();
  }

  updateCheckoutUI();
}

function changeQty(id, delta, variantKey) {
  let item = findCartItem(id, variantKey);
  if (!item && !variantKey) item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => !(i.id === item.id && i.variantKey === item.variantKey));
  }
  save();
  renderCart();
  updateCartCounter();

  if (currentProductId === id) {
    renderProductAction(id);
  }
}

function renderCart() {
  const list = document.getElementById("cart-list");
  list.innerHTML = "";
  if (cart.length === 0) {
    list.innerHTML = "<p class='empty'>Корзина пуста 🛒</p>";
    document.getElementById("cart-total").innerText = "Итого: 0 ₽";
    updateCartCounter();
    updateCheckoutUI();
    return;
  }
  let total = 0;
  cart.forEach(i => {
    total += i.price * i.qty;
    const div = document.createElement("div");
    div.className = "list-item";
    const variantInfo = (i.selectedOptions && i.selectedOptions.length)
      ? `<div class="cart-variant">${i.selectedOptions.map(opt => `${opt.label}: ${opt.value}`).join(", ")}</div>`
      : "";
    div.innerHTML = `
      <img class="cart-img" src="${i.image || (i.images ? i.images[0] : "")}">
      <div class="cart-info">
        <div class="cart-title">${i.title}</div>
        <div class="cart-price">${i.price} ₽</div>
        ${variantInfo}
      </div>
      <div class="cart-controls">
        <button class="cart-btn" data-action="qty" data-id="${i.id}" data-variant="${i.variantKey}" data-delta="-1">−</button>
        <span class="cart-qty">${i.qty}</span>
        <button class="cart-btn" data-action="qty" data-id="${i.id}" data-variant="${i.variantKey}" data-delta="1">+</button>
      </div>
    `;
    list.appendChild(div);
  });
  document.getElementById("cart-total").innerText = `Итого: ${total} ₽`;
  updateCheckoutUI();
}

function updateCartCounter() {
  const el = document.getElementById("cart-count");
  const count = cart.reduce((s, i) => s + i.qty, 0);
  if (count > 0) {
    el.style.display = "block";
    el.innerText = count;
  } else el.style.display = "none";
}

async function completeCheckout({ name, phone, delivery, address, payment }) {
  if (cart.length === 0) {
    showCheckoutError("Корзина пуста");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const orderItems = cart.map(item => {
    const variants = (item.selectedOptions && item.selectedOptions.length)
      ? ` (${item.selectedOptions.map(opt => `${opt.label}: ${opt.value}`).join(', ')})`
      : "";
    return `${item.title}${variants} x${item.qty}`;
  }).join(", ");

  const order = {
    id: Date.now(),
    name,
    phone,
    delivery,
    address,
    payment,
    total,
    items: orderItems
  };

  // === Адрес твоего скрипта Google Apps Script (оканчивается на /exec)
  const GAS_URL = "https://script.google.com/macros/s/AKfycbzidnlJTya1d-4GC6anAaZH6IIaoCf9voh9tXP9R-pBSOgmYXomWELFpgrAcjSmq1FCrQ/exec";

  // === Если работаем локально → добавим прокси
  const isLocal = location.hostname === "127.0.0.1" || location.hostname === "localhost";
  const endpoint = isLocal
    ? `https://cors-anywhere.herokuapp.com/${GAS_URL}`
    : GAS_URL;

  console.log("Отправляем заказ в:", endpoint);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    const text = await res.text();
    console.log("Ответ Google:", text);
  } catch (err) {
    console.error("Ошибка отправки заказа:", err);
  }

  // === Локально сохраняем для отображения в WebApp
  orders.push({ ...order, status: "Новый", items: cart });
  cart = [];
  save();
  renderCart();
  updateCartCounter();
  renderOrders();
}


/* =======================
   ЗАКАЗЫ
======================= */
function renderOrders() {
  const list = document.getElementById("orders-list");
  list.innerHTML = "";
  if (orders.length === 0) {
    list.innerHTML = "<p class='empty'>У вас пока нет заказов 📋</p>";
    return;
  }
  orders.forEach(o => {
    const div = document.createElement("div");
    div.className = "order-card";
    div.innerHTML = `
      <div><b>Заказ #${o.id}</b></div>
      <div>Дата: ${new Date(o.id).toLocaleDateString()}</div>
      <div>Сумма: ${o.total} ₽</div>
      <div>Доставка: ${formatDelivery(o.delivery)}</div>
      <div>Оплата: ${formatPayment(o.payment)}</div>
      <div>Статус: ${o.status || "Новый"}</div>
    `;
    div.onclick = () => openOrderDetail(o.id);
    list.appendChild(div);
  });
}


function openOrderDetail(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const content = document.getElementById("order-detail-content");
  const trimmedName = (order.name || order.fio || "").trim();
  const trimmedPhone = (order.phone || "").trim();
  const trimmedAddress = (order.address || "").trim();
  const rows = [
    { label: "Номер заказа", value: `#${order.id}` },
    { label: "Дата", value: new Date(order.id).toLocaleDateString() },
    { label: "Клиент", value: trimmedName || null },
    { label: "Телефон", value: trimmedPhone || null },
    { label: "Статус", value: order.status || "Новый" },
    { label: "Доставка", value: order.delivery ? formatDelivery(order.delivery) : null },
    { label: "Адрес", value: order.delivery === "courier" ? (trimmedAddress || null) : null },
    { label: "Оплата", value: order.payment ? formatPayment(order.payment) : null },
    { label: "Сумма", value: `${order.total} ₽` }
  ];

  const itemsLine = order.items.map(i => {
    const variantText = (i.selectedOptions && i.selectedOptions.length)
      ? ` (${i.selectedOptions.map(opt => `${opt.label}: ${opt.value}`).join(', ')})`
      : "";
    return `${i.title}${variantText} x${i.qty}`;
  }).join(", ");

  const rowsHtml = rows
    .filter(row => row.value)
    .map(row => `<div class="order-detail-item"><b>${row.label}:</b> ${row.value}</div>`) 
    .join("");

  content.innerHTML = `
    ${rowsHtml}
    <div class="order-detail-item"><b>Состав:</b> ${itemsLine}</div>
  `;

  showScreen("order-detail");
}

/* =======================
   ГЛАВНАЯ КАРУСЕЛЬ
======================= */
function initCarousel(baseId, images) {
  const carouselEl = document.getElementById(baseId);
  const track = document.getElementById(`${baseId}-track`);
  const dotsWrap = document.getElementById(`${baseId}-dots`);
  const prevBtn = document.getElementById(`${baseId}-prev`);
  const nextBtn = document.getElementById(`${baseId}-next`);

  if (!carouselEl || !track) return;

  track.innerHTML = "";
  images.forEach((src, idx) => {
    const img = document.createElement("img");
    img.className = "carousel-item";
    img.src = src;
    img.alt = `Фото ${idx + 1}`;
    track.appendChild(img);
  });

  const dots = [];
  dotsWrap.innerHTML = "";
  images.forEach((_, i) => {
    const dot = document.createElement("button");
    if (i === 0) dot.classList.add("active");
    dotsWrap.appendChild(dot);
    dots.push(dot);
  });

  const scroller = setupScrollableCarousel({
    carousel: carouselEl,
    trackSelector: ".carousel-track",
    prevSelector: ".prev",
    nextSelector: ".next",
    onChange: (index, total) => {
      dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
      if (prevBtn) prevBtn.style.display = total > 1 ? "" : "none";
      if (nextBtn) nextBtn.style.display = total > 1 ? "" : "none";
    }
  });

  dots.forEach((dot, idx) => {
    dot.addEventListener("click", () => scroller && scroller.goTo(idx));
  });

  if (scroller) scroller.goTo(0);
}

/* =======================
   ИНИЦИАЛИЗАЦИЯ
======================= */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-to-catalog").addEventListener("click", () => showScreen("catalog"));
  document.getElementById("tab-menu").addEventListener("click", () => showScreen("menu"));
  document.getElementById("tab-catalog").addEventListener("click", () => showScreen("catalog"));
  document.getElementById("tab-cart").addEventListener("click", () => showScreen("cart"));
  document.getElementById("tab-orders").addEventListener("click", () => showScreen("orders"));
  const checkoutBtn = document.getElementById("btn-checkout");
  checkoutModalEl = document.getElementById("checkout-modal");
  checkoutFormEl = document.getElementById("checkout-form");
  checkoutErrorEl = document.getElementById("checkout-error");
  checkoutTotalEl = document.getElementById("checkout-total");
  checkoutAddressGroupEl = document.getElementById("checkout-address-group");
  checkoutSubmitBtn = document.getElementById("checkout-submit");
  checkoutDeliveryInputs = Array.from(document.querySelectorAll("input[name='delivery']"));
  checkoutPaymentInputs = Array.from(document.querySelectorAll("input[name='payment']"));

  if (checkoutBtn) checkoutBtn.addEventListener("click", () => openCheckoutModal());
  const closeBtn = document.getElementById("checkout-close");
  const backdrop = document.getElementById("checkout-backdrop");
  if (closeBtn) closeBtn.addEventListener("click", () => closeCheckoutModal());
  if (backdrop) backdrop.addEventListener("click", () => closeCheckoutModal());
  if (checkoutFormEl) checkoutFormEl.addEventListener("submit", handleCheckoutSubmit);
  checkoutDeliveryInputs.forEach(input => input.addEventListener("change", handleCheckoutDeliveryChange));
  checkoutPaymentInputs.forEach(input => input.addEventListener("change", handleCheckoutPaymentChange));

  updateCheckoutUI();

  document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      const cat = card.dataset.cat;
      openCategory(cat);
    });
  });

  document.body.addEventListener("click", e => {
    if (e.target.dataset.action === "open-product") openProduct(+e.target.dataset.id);
    if (e.target.dataset.action === "add-to-cart") addToCart(+e.target.dataset.id);
    if (e.target.dataset.action === "qty") changeQty(+e.target.dataset.id, +e.target.dataset.delta, e.target.dataset.variant);
  });

  renderCart();
  renderOrders();
  updateCartCounter();
  initCarousel("gallery", GALLERY_IMAGES);
});
