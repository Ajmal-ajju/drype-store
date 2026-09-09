/* =====================================================
   DRYPE — STORE JAVASCRIPT
   ===================================================== */


/* =====================================================
   PRODUCT DATA
   ===================================================== */

let products = [

    /* ABAYAS */

    {
        id: 1,
        name: "Noor Abaya",
        category: "abayas",
        price: 2499,
        type: "abaya"
    },

    {
        id: 2,
        name: "Aira Abaya",
        category: "abayas",
        price: 2899,
        type: "abaya"
    },

    {
        id: 3,
        name: "Black Pearl Abaya",
        category: "abayas",
        price: 3199,
        type: "abaya"
    },

    {
        id: 4,
        name: "Haya Abaya",
        category: "abayas",
        price: 2699,
        type: "abaya"
    },


    /* JACKETS */

    {
        id: 5,
        name: "Urban Jacket",
        category: "jackets",
        price: 2999,
        type: "jacket"
    },

    {
        id: 6,
        name: "Classic Bomber",
        category: "jackets",
        price: 3499,
        type: "jacket"
    },

    {
        id: 7,
        name: "Midnight Jacket",
        category: "jackets",
        price: 3299,
        type: "jacket"
    },


    /* SHIRTS */

    {
        id: 8,
        name: "Essential Shirt",
        category: "shirts",
        price: 1499,
        type: "shirt"
    },

    {
        id: 9,
        name: "Oversized Shirt",
        category: "shirts",
        price: 1699,
        type: "shirt"
    },

    {
        id: 10,
        name: "Classic Linen Shirt",
        category: "shirts",
        price: 1899,
        type: "shirt"
    },


    /* SHOES */

    {
        id: 11,
        name: "DRYPE Runner",
        category: "shoes",
        price: 2799,
        type: "shoes"
    },

    {
        id: 12,
        name: "Street Low",
        category: "shoes",
        price: 2499,
        type: "shoes"
    },

    {
        id: 13,
        name: "Mono Sneaker",
        category: "shoes",
        price: 3199,
        type: "shoes"
    },


    /* PANTS */

    {
        id: 14,
        name: "Wide Fit Pants",
        category: "pants",
        price: 1799,
        type: "pants"
    },

    {
        id: 15,
        name: "Relaxed Cargo",
        category: "pants",
        price: 1999,
        type: "pants"
    },

    {
        id: 16,
        name: "Classic Trousers",
        category: "pants",
        price: 2199,
        type: "pants"
    }

];


/* =====================================================
   VARIABLES
   ===================================================== */

let cart = JSON.parse(
    localStorage.getItem("DRYPE_CART")
) || [];

let currentCategory = "all";
const PREPAID_DISCOUNT = 0.12;
let checkoutOverlay = document.getElementById("checkoutOverlay");
let checkoutForm = document.getElementById("checkoutForm");
let checkoutSummary = document.getElementById("checkoutSummary");
let checkoutCartSnapshot = [];

async function loadRemoteProducts(){
    try{
        const res = await fetch("/api/products", {headers: {"Accept":"application/json"}});
        if(!res.ok) return;
        const data = await res.json();
        if(Array.isArray(data.products) && data.products.length){
            products = data.products;
            renderProducts();
        }
    }catch(e){ /* static/local mode remains usable */ }
}

function openCheckout(){
    if(!cart.length){ showToast("Your cart is empty"); return; }
    checkoutCartSnapshot = cart.map(item => ({...item}));
    const subtotal = checkoutCartSnapshot.reduce((s,i)=>s+i.price*i.quantity,0);
    const discount = Math.round(subtotal*PREPAID_DISCOUNT);
    const total = subtotal-discount;
    checkoutSummary.innerHTML = `
      <strong>${checkoutCartSnapshot.length} item(s)</strong><br>
      Subtotal: ${formatPrice(subtotal)}<br>
      Prepaid discount (12%): −${formatPrice(discount)}<br>
      <strong>Payable: ${formatPrice(total)}</strong>
    `;
    checkoutOverlay.classList.add("open");
    document.body.style.overflow="hidden";
}
function closeCheckout(){
    checkoutOverlay.classList.remove("open");
    document.body.style.overflow="";
}
async function submitCheckout(event){
    event.preventDefault();
    const data = new FormData(checkoutForm);
    const subtotal = checkoutCartSnapshot.reduce((s,i)=>s+i.price*i.quantity,0);
    const discount = Math.round(subtotal*PREPAID_DISCOUNT);
    const total = subtotal-discount;
    const order = {
      customer:{
        name:data.get("name"), phone:data.get("phone"), address:data.get("address"),
        city:data.get("city"), state:data.get("state"), pincode:data.get("pincode")
      },
      items: checkoutCartSnapshot.map(i=>({id:i.id,name:i.name,price:i.price,quantity:i.quantity})),
      subtotal, discount, total, paymentMethod:"prepaid_upi"
    };
    const button=checkoutForm.querySelector(".checkout-pay");
    button.disabled=true; button.textContent="Preparing secure UPI…";
    try{
      const res=await fetch("/api/payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(order)});
      if(!res.ok) throw new Error("Payment service unavailable");
      const result=await res.json();
      if(result.upiUrl){
        window.location.href=result.upiUrl;
        showToast("UPI payment opened");
      }else{
        throw new Error("No payment link");
      }
    }catch(err){
      // Development fallback only: never expose the real UPI ID in the UI.
      showToast("UPI service is not configured yet");
    }finally{
      button.disabled=false; button.textContent="Continue to UPI payment ↗";
    }
}
function trackDTDC(){
    const id=(document.getElementById("trackingInput").value||"").trim();
    const result=document.getElementById("trackingResult");
    if(!id){ result.textContent="Enter your DTDC AWB / consignment number."; return; }
    const clean=id.replace(/[^a-zA-Z0-9]/g,"");
    result.innerHTML=`Tracking <strong>${clean}</strong> on official DTDC…`;
    const url=`https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno=${encodeURIComponent(clean)}`;
    setTimeout(()=>window.open(url,"_blank","noopener,noreferrer"),150);
}



/* =====================================================
   ELEMENTS
   ===================================================== */

const productsGrid =
    document.getElementById("productsGrid");

const cartCount =
    document.getElementById("cartCount");

const cartItems =
    document.getElementById("cartItems");

const cartTotal =
    document.getElementById("cartTotal");

const cartDrawer =
    document.getElementById("cartDrawer");

const cartOverlay =
    document.getElementById("cartOverlay");

const toast =
    document.getElementById("toast");

const searchInput =
    document.getElementById("searchInput");

const sortSelect =
    document.getElementById("sortSelect");


/* =====================================================
   FORMAT PRICE
   ===================================================== */

function formatPrice(price) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(price);

}


/* =====================================================
   CATEGORY NAME
   ===================================================== */

function categoryName(category) {

    return category.charAt(0).toUpperCase()
        + category.slice(1);

}


/* =====================================================
   RENDER PRODUCTS
   ===================================================== */

function renderProducts() {

    let filtered = [...products];

    /* Category */

    if (currentCategory !== "all") {

        filtered = filtered.filter(
            product =>
                product.category === currentCategory
        );

    }


    /* Search */

    const search =
        searchInput.value
            .toLowerCase()
            .trim();

    if (search) {

        filtered = filtered.filter(product =>
            product.name
                .toLowerCase()
                .includes(search)
        );

    }


    /* Sort */

    const sort = sortSelect.value;

    if (sort === "low") {

        filtered.sort(
            (a, b) => a.price - b.price
        );

    }

    if (sort === "high") {

        filtered.sort(
            (a, b) => b.price - a.price
        );

    }

    if (sort === "name") {

        filtered.sort(
            (a, b) =>
                a.name.localeCompare(b.name)
        );

    }


    /* Empty */

    if (!filtered.length) {

        productsGrid.innerHTML = `
            <div style="
                grid-column:1/-1;
                padding:80px 0;
                text-align:center;
                color:#777;
            ">
                No products found.
            </div>
        `;

        return;

    }


    /* HTML */

    productsGrid.innerHTML =
        filtered.map(product => {

            return `

            <div
                class="product-card-wrapper"
                data-id="${product.id}"
            >

                <article
                    class="product-card"
                    data-product-id="${product.id}"
                >

                    <div class="product-image">

                        <div
                            class="product-visual ${product.type}"
                            ${product.image ? `style="background-image:url('${String(product.image).replace(/'/g,"\\'")}');background-size:cover;background-position:center"` : ""}
                        ></div>

                    </div>


                    <div class="product-info">

                        <div class="product-category">
                            ${categoryName(product.category)}
                        </div>

                        <h3 class="product-name">
                            ${product.name}
                        </h3>

                        <div class="product-price">
                            ${formatPrice(product.price)}
                        </div>


                        <div class="product-actions">

                            <div class="quantity">

                                <button
                                    class="qty-minus"
                                    data-id="${product.id}"
                                >
                                    −
                                </button>

                                <span
                                    id="qty-${product.id}"
                                >
                                    1
                                </span>

                                <button
                                    class="qty-plus"
                                    data-id="${product.id}"
                                >
                                    +
                                </button>

                            </div>

                            <button
                                class="add-cart"
                                data-id="${product.id}"
                            >
                                Add
                            </button>

                        </div>


                        <button
                            class="product-whatsapp"
                            data-id="${product.id}"
                        >
                            Order on WhatsApp ↗
                        </button>

                    </div>

                </article>

            </div>

            `;

        }).join("");


    attachProductEvents();
    initialize3DCards();

}


/* =====================================================
   PRODUCT EVENTS
   ===================================================== */

function attachProductEvents() {

    document
        .querySelectorAll(".qty-minus")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(button.dataset.id);

                    const element =
                        document.getElementById(
                            `qty-${id}`
                        );

                    let value =
                        Number(element.textContent);

                    if (value > 1) {
                        value--;
                    }

                    element.textContent = value;

                }
            );

        });


    document
        .querySelectorAll(".qty-plus")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(button.dataset.id);

                    const element =
                        document.getElementById(
                            `qty-${id}`
                        );

                    let value =
                        Number(element.textContent);

                    if (value < 20) {
                        value++;
                    }

                    element.textContent = value;

                }
            );

        });


    document
        .querySelectorAll(".add-cart")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(button.dataset.id);

                    const quantityElement =
                        document.getElementById(
                            `qty-${id}`
                        );

                    const quantity =
                        Number(
                            quantityElement.textContent
                        );

                    addToCart(id, quantity);

                }
            );

        });


    document
        .querySelectorAll(".product-whatsapp")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(button.dataset.id);

                    const quantityElement =
                        document.getElementById(
                            `qty-${id}`
                        );

                    const quantity =
                        Number(
                            quantityElement.textContent
                        );

                    orderProductWhatsApp(
                        id,
                        quantity
                    );

                }
            );

        });

}


/* =====================================================
   ADD TO CART
   ===================================================== */

function addToCart(id, quantity = 1) {

    const product =
        products.find(
            item => item.id === id
        );

    if (!product) return;


    const existing =
        cart.find(
            item => item.id === id
        );


    if (existing) {

        existing.quantity += quantity;

    } else {

        cart.push({
            ...product,
            quantity
        });

    }


    saveCart();

    updateCartUI();

    showToast(
        `${product.name} added to cart`
    );

}


/* =====================================================
   SAVE CART
   ===================================================== */

function saveCart() {

    localStorage.setItem(
        "DRYPE_CART",
        JSON.stringify(cart)
    );

}


/* =====================================================
   CART UI
   ===================================================== */

function updateCartUI() {

    const count =
        cart.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );

    cartCount.textContent = count;


    const total =
        cart.reduce(
            (sum, item) =>
                sum + item.price * item.quantity,
            0
        );

    cartTotal.textContent =
        formatPrice(total);


    if (!cart.length) {

        cartItems.innerHTML = `

            <div class="empty-cart">

                <div>○</div>

                <p>Your cart is empty.</p>

                <button id="continueShopping">
                    Continue Shopping
                </button>

            </div>

        `;

        document
            .getElementById("continueShopping")
            .addEventListener(
                "click",
                closeCart
            );

        return;

    }


    cartItems.innerHTML =
        cart.map(item => `

            <div class="cart-item">

                <div class="cart-item-image"></div>


                <div class="cart-item-info">

                    <h4>
                        ${item.name}
                    </h4>

                    <p>
                        ${formatPrice(item.price)}
                    </p>


                    <div class="cart-quantity">

                        <button
                            onclick="changeCartQuantity(
                                ${item.id},
                                -1
                            )"
                        >
                            −
                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            onclick="changeCartQuantity(
                                ${item.id},
                                1
                            )"
                        >
                            +
                        </button>

                    </div>


                    <button
                        class="remove-item"
                        onclick="removeFromCart(
                            ${item.id}
                        )"
                    >
                        REMOVE
                    </button>

                </div>


                <div class="cart-item-price">

                    ${formatPrice(
                        item.price * item.quantity
                    )}

                </div>

            </div>

        `).join("");

}


/* =====================================================
   CHANGE CART QUANTITY
   ===================================================== */

function changeCartQuantity(id, change) {

    const item =
        cart.find(
            product => product.id === id
        );

    if (!item) return;


    item.quantity += change;


    if (item.quantity <= 0) {

        cart =
            cart.filter(
                product => product.id !== id
            );

    }


    saveCart();
    updateCartUI();

}


/* =====================================================
   REMOVE CART ITEM
   ===================================================== */

function removeFromCart(id) {

    cart =
        cart.filter(
            item => item.id !== id
        );

    saveCart();

    updateCartUI();

}


/* =====================================================
   OPEN CART
   ===================================================== */

function openCart() {

    cartDrawer.classList.add("open");

    cartOverlay.classList.add("active");

    document.body.style.overflow = "hidden";

}


/* =====================================================
   CLOSE CART
   ===================================================== */

function closeCart() {

    cartDrawer.classList.remove("open");

    cartOverlay.classList.remove("active");

    document.body.style.overflow = "";

}


/* =====================================================
   WHATSAPP PRODUCT ORDER
   ===================================================== */

function orderProductWhatsApp(id, quantity) {

    const product =
        products.find(
            item => item.id === id
        );

    if (!product) return;


    const total =
        product.price * quantity;


    const message =

`Hello DRYPE 👋

I want to order:

Product: ${product.name}
Category: ${categoryName(product.category)}
Quantity: ${quantity}
Price: ${formatPrice(product.price)}
Total: ${formatPrice(total)}

Please confirm availability and order details.

Thank you.
DRYPE — OWN IT.`;


    /*
       Main WhatsApp number:
       +91 6363468211

       Alternate:
       +91 9972961311
    */

    const phone =
        "916363468211";


    const url =
        `https://wa.me/${phone}?text=${
            encodeURIComponent(message)
        }`;


    window.open(url, "_blank");

}


/* =====================================================
   WHATSAPP CART ORDER
   ===================================================== */

function orderCartWhatsApp() {

    if (!cart.length) {

        showToast("Your cart is empty");

        return;

    }


    let message =
`Hello DRYPE 👋

I want to place an order:

`;


    cart.forEach(item => {

        message +=
`
• ${item.name}
  Quantity: ${item.quantity}
  Price: ${formatPrice(
      item.price * item.quantity
  )}
`;

    });


    const total =
        cart.reduce(
            (sum, item) =>
                sum +
                item.price *
                item.quantity,
            0
        );


    message +=
`
Total: ${formatPrice(total)}

Please confirm availability and order details.

Thank you.
DRYPE — OWN IT.`;


    /*
       MAIN WHATSAPP:
       +91 6363468211

       ALTERNATE:
       +91 9972961311
    */

    const phone =
        "916363468211";


    const url =
        `https://wa.me/${phone}?text=${
            encodeURIComponent(message)
        }`;


    window.open(url, "_blank");

}


/* =====================================================
   CATEGORY FILTER
   ===================================================== */

document
    .querySelectorAll(".category-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".category-item"
                    )
                    .forEach(item =>
                        item.classList.remove(
                            "active"
                        )
                    );

                button.classList.add("active");

                currentCategory =
                    button.dataset.category;

                renderProducts();

                document
                    .getElementById("shop")
                    .scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );

    });


/* =====================================================
   SEARCH
   ===================================================== */

searchInput.addEventListener(
    "input",
    renderProducts
);


/* =====================================================
   SORT
   ===================================================== */

sortSelect.addEventListener(
    "change",
    renderProducts
);


/* =====================================================
   CART BUTTON
   ===================================================== */

document
    .getElementById("cartButton")
    .addEventListener(
        "click",
        openCart
    );


document
    .getElementById("closeCart")
    .addEventListener(
        "click",
        closeCart
    );


cartOverlay.addEventListener(
    "click",
    closeCart
);


document
    .getElementById("whatsappCart")
    .addEventListener(
        "click",
        orderCartWhatsApp
    );



document.getElementById("checkoutButton").addEventListener("click", openCheckout);
document.getElementById("closeCheckout").addEventListener("click", closeCheckout);
checkoutOverlay.addEventListener("click", (e)=>{ if(e.target===checkoutOverlay) closeCheckout(); });
checkoutForm.addEventListener("submit", submitCheckout);
document.getElementById("trackingButton").addEventListener("click", trackDTDC);
document.getElementById("trackingInput").addEventListener("keydown", e=>{if(e.key==="Enter") trackDTDC();});
loadRemoteProducts();

/* =====================================================
   MOBILE MENU
   ===================================================== */

const menuButton =
    document.getElementById("menuButton");

const mobileNav =
    document.getElementById("mobileNav");


menuButton.addEventListener(
    "click",
    () => {

        mobileNav.classList.toggle("open");

    }
);


mobileNav
    .querySelectorAll("a")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                mobileNav.classList.remove(
                    "open"
                );

            }
        );

    });


/* =====================================================
   HEADER SCROLL
   ===================================================== */

window.addEventListener(
    "scroll",
    () => {

        const header =
            document.getElementById(
                "header"
            );

        if (window.scrollY > 50) {

            header.classList.add(
                "scrolled"
            );

        } else {

            header.classList.remove(
                "scrolled"
            );

        }

    }
);


/* =====================================================
   3D PRODUCT CARDS
   ===================================================== */

function initialize3DCards() {

    const cards =
        document.querySelectorAll(
            ".product-card"
        );


    cards.forEach(card => {

        card.addEventListener(
            "mousemove",
            event => {

                const rect =
                    card.getBoundingClientRect();


                const x =
                    event.clientX -
                    rect.left;


                const y =
                    event.clientY -
                    rect.top;


                const centerX =
                    rect.width / 2;


                const centerY =
                    rect.height / 2;


                const rotateY =
                    ((x - centerX) /
                        centerX) * 8;


                const rotateX =
                    -((y - centerY) /
                        centerY) * 8;


                card.style.transform = `
                    rotateX(${rotateX}deg)
                    rotateY(${rotateY}deg)
                    translateZ(10px)
                `;

            }
        );


        card.addEventListener(
            "mouseleave",
            () => {

                card.style.transform =
                    "rotateX(0deg) rotateY(0deg) translateZ(0)";

            }
        );

    });

}


/* =====================================================
   HERO 3D PARALLAX
   ===================================================== */

const heroVisual =
    document.getElementById(
        "heroVisual"
    );


document.addEventListener(
    "mousemove",
    event => {

        if (
            window.innerWidth < 800
        ) return;


        const x =
            (event.clientX /
                window.innerWidth -
                .5);


        const y =
            (event.clientY /
                window.innerHeight -
                .5);


        const rotateY =
            x * 12;


        const rotateX =
            -y * 10;


        heroVisual.style.transform = `
            translateY(-50%)
            perspective(1200px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
        `;

    }
);


/* =====================================================
   SCROLL REVEAL
   ===================================================== */

function revealOnScroll() {

    const reveals =
        document.querySelectorAll(
            ".reveal"
        );


    reveals.forEach(element => {

        const top =
            element.getBoundingClientRect()
                .top;


        if (
            top <
            window.innerHeight - 80
        ) {

            element.classList.add(
                "visible"
            );

        }

    });

}


window.addEventListener(
    "scroll",
    revealOnScroll
);


/* =====================================================
   TOAST
   ===================================================== */

let toastTimer;


function showToast(message) {

    toast.querySelector("p")
        .textContent = message;


    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =====================================================
   LOADER
   ===================================================== */

window.addEventListener(
    "load",
    () => {

        setTimeout(
            () => {

                document
                    .getElementById("loader")
                    .classList.add(
                        "hidden"
                    );

                revealOnScroll();

            },
            900
        );

    }
);


/* =====================================================
   INITIALIZE
   ===================================================== */

renderProducts();

updateCartUI();

revealOnScroll();