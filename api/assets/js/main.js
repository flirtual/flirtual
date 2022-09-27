function toggle_personal() {
    if (!document.getElementById("nav_personal_menu").classList.contains("open")) {
        show_personal();
    } else {
        hide_personal();
    }
}
function show_personal() {
    document.getElementById("nav_personal_menu").classList.add("open");
}
function hide_personal() {
    document.getElementById("nav_personal_menu").classList.remove("open");
}

document.addEventListener("click", function (event) {
    if (event.target.closest("#nav_personal_menu") === null && event.target.closest("#nav_personal") === null) {
        hide_personal();
    }
});

function external_link(event, link) {
    if (link.href.startsWith("https://" + window.location.hostname + "/")) {
        return true;
    }

    event.preventDefault();
    if (confirm("You are leaving Flirtual. Are you sure you want to visit " + link.href + "? It could be sketchy!")) {
        window.open(link.href, "_blank", "noopener");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const swiper = new Swiper(".swiper", {
        slidesPerView: 1,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        keyboard: {
            enabled: true,
            onlyInViewport: true,
        }
    });
});

function daynight(hour) {
    var hour = (hour === undefined) ? new Date().getHours() : hour;
    var gradients = [
        ["#012459", "#001322", "#010103"],
        ["#003972", "#001322", "#00101f"],
        ["#003972", "#001322", "#00101f"],
        ["#004372", "#00182b", "#001321"],
        ["#004372", "#011d34", "#001829"],
        ["#016792", "#00182b", "#014461"],
        ["#07729f", "#042c47", "#028bc7"],
        ["#12a1c0", "#07506e", "#b5ecf8"],
        ["#74d4cc", "#1386a6", "#d9f3f1"],
        ["#efeebc", "#61d0cf", "#e9f7ef"],
        ["#fee154", "#a3dec6", "#f4f7df"],
        ["#fdc352", "#e8ed92", "#feefd0"],
        ["#ffac6f", "#ffe467", "#ffefd7"],
        ["#fda65a", "#ffe467", "#ffeed4"],
        ["#fd9e58", "#ffe467", "#ffedd4"],
        ["#f18448", "#ffd364", "#fde7d1"],
        ["#f06b7e", "#f9a856", "#fcdfd7"],
        ["#ca5a92", "#f4896b", "#f6d8dd"],
        ["#5b2c83", "#d1628b", "#b69ec9"],
        ["#371a79", "#713684", "#28133f"],
        ["#28166b", "#45217c", "#150b2e"],
        ["#192861", "#372074", "#0f0e2a"],
        ["#040b3c", "#233072", "#060611"],
        ["#040b3c", "#012459", "#020207"]
    ];
    document.querySelector(":root").style.setProperty("--gradient-l", gradients[hour][0]);
    document.querySelector(":root").style.setProperty("--gradient-r", gradients[hour][1]);
    document.querySelector(":root").style.setProperty("--bg", gradients[hour][2]);
}

let konami = 0;
const KONAMI_CODE = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
document.addEventListener('keydown', (e) => {
    konami = (e.keyCode == KONAMI_CODE[konami]) ? konami + 1 : 0;
    if (konami == KONAMI_CODE.length) {
        if (getComputedStyle(document.body).getPropertyValue("--gradient-l") == "#ff8975") {
            fetch("/api/konami");
            daynight();
            new Audio("/audio/konami.mp3").play();
        } else {
            fetch("/api/konamioff");
            document.querySelector(":root").style.setProperty("--gradient-l", "#ff8975");
            document.querySelector(":root").style.setProperty("--gradient-r", "#e9658b");
            document.querySelector(":root").style.setProperty("--bg", "#fffaf0");
            new Audio("/audio/konami.mp3").play();
        }
        konami = 0;
    }
});

[].forEach.call(document.querySelectorAll("form"), function(form) {
    form.addEventListener("submit", async function () {
        document.body.classList.add("loading");
        [].forEach.call(form.querySelectorAll("button[type='submit']"), async function(btn) {
            await new Promise(r => setTimeout(r, 250));
            btn.classList.add("loading");
        });
    });
});

addEventListener("turbo:submit-start", ({ target }) => {
    document.body.classList.add("loading");
});

addEventListener("turbo:submit-end", ({ target }) => {
    document.body.classList.remove("loading");
});

async function removeProfile() {
}

async function nextProfile() {
    [].forEach.call(document.querySelectorAll(".profiles > div:first-child .box"), function(box) {
        box.style.transition = "opacity 0.5s ease";
        box.style.opacity = 0;
    });

    setTimeout(function() {
        document.querySelector(".profiles > div").remove();
        if (!document.querySelector(".profiles > div")) {
            window.location.reload();
        }

        document.querySelector(".spinner").style.opacity = 0;
        [].forEach.call(document.querySelectorAll(".profiles > div:first-child .box"), function(box) {
            box.style.opacity = 0;
            box.style.transition = "opacity 0.5s ease";
            box.style.opacity = 1;
        });
    }, 500);
}

function like(id, type) {
    document.querySelector(".spinner").style.opacity = 1;
    fetch("/api/like?user=" + id + "&type=" + type)
        .then(response => response.text())
        .then((response) => {
            if (response == "match\n") {
                window.location = "/" + id + "?return=/";
            } else {
                nextProfile();
            }
        });
}

function pass(id) {
    document.querySelector(".spinner").style.opacity = 1;
    fetch("/api/pass?user=" + id);
    nextProfile();
}

function hpass(id) {
    document.querySelector(".spinner").style.opacity = 1;
    fetch("/api/hpass?user=" + id);
    nextProfile();
}

if ("Notification" in window) {
    if (Notification.permission === "default" && !localStorage.getItem("notification_optout")) {
        document.getElementById("notification_prompt").style.display = "block";
    }
}
