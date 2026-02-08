// Redirect / to index.html
if(window.location.pathname === "/"){
    window.location.href = "/index.html"
}

// index.html
if(window.location.pathname === "/index.html"){
    const form = document.getElementById("form");
    const display = document.getElementById("display");
    const linkATag = document.getElementById("linkATag");
    const copyLink = document.getElementById("copyLink");
    const warningSymbol = document.getElementById("warningSymbol");
    const warningText = document.getElementById("warningText");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        let url = formData.get("urlInput");

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }

        console.log(`URL entered: ${url}`);

        const response = await fetch("/new", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        const fetchData = await response.json();

        if (response.status === 429) {
            display.textContent = "Too many requests. Please try again later.";
            display.style.display = "block";
            display.classList.add("error-display");
            linkATag.classList.add("error-link");
            return;
        }

        if (response.ok) {
            const finalUrl = `${window.location.origin}/dir/${fetchData.id}`;
            display.textContent = finalUrl;
            linkATag.href = finalUrl;
            display.style.display = "block";
            copyLink.style.display = "inline-block";
            warningText.style.display = "block";
            warningSymbol.style.display = "block";
            display.classList.remove("error-display");
            linkATag.classList.remove("error-link");
            copyBtnClicked(copyLink, finalUrl);
        } else {
            display.textContent = fetchData.error || "Invalid URL. Please try again.";
            display.style.display = "block";
            display.classList.add("error-display");
            linkATag.classList.add("error-link");
        }
    });
}

// myUrls.html
if (window.location.pathname === "/myUrls.html") {
    const form = document.getElementById("form");
    const myUrlsErr = document.getElementById("myUrlsErr");
    const myUrlsContainer = document.getElementById("myUrlsContainer");

    const renderList = () => {
        myUrlsContainer.innerHTML = "";
        const savedUrls = JSON.parse(localStorage.getItem("myShortUrls") || "[]");

        savedUrls.reverse().forEach(data=>{
            const item = document.createElement("li");
            item.classList.add("urlItem");

            const flexWrap = document.createElement("div");
            flexWrap.classList.add("url-flex-wrapper");

            const textWrap = document.createElement("div");
            textWrap.classList.add("urlText");

            const shortA = document.createElement("a");
            shortA.href = data.short;
            shortA.textContent = data.short;
            shortA.classList.add("MyUrlsUrlDisplay","scroll-fade");

            const origA = document.createElement("a");
            origA.href = data.original;
            origA.textContent = data.original;
            origA.classList.add("originalUrlDisplay","scroll-fade");

            const btn = document.createElement("button");
            btn.textContent = "Copy";
            btn.dataset.copyLabel = "Copy";
            btn.classList.add("btn", "btn-outline-primary", "copyBtn");
            copyBtnClicked(btn,data.short);

            const btn2 = document.createElement("button");
            btn2.textContent = "Remove";
            btn2.classList.add("btn","btn-outline-primary","remBtn");

            btn2.addEventListener("click",()=>{
                const list = JSON.parse(localStorage.getItem("myShortUrls")||"[]");
                const index = list.findIndex(u=>u.short===data.short);
                list.splice(index,1);
                localStorage.setItem("myShortUrls",JSON.stringify(list));
                renderList();
            });

            textWrap.appendChild(shortA);
            textWrap.appendChild(origA);

            const btnWrap = document.createElement("div");
            btnWrap.classList.add("btnWrap");
            btnWrap.appendChild(btn);
            btnWrap.appendChild(btn2);

            flexWrap.appendChild(textWrap);
            flexWrap.appendChild(btnWrap);
            item.appendChild(flexWrap);
            myUrlsContainer.appendChild(item);
        });

        const displays = myUrlsContainer.querySelectorAll(".MyUrlsUrlDisplay,.originalUrlDisplay");
        displays.forEach(el=>{
            el.scrollLeft = el.scrollWidth;

            el.addEventListener("wheel",e=>{
                if(e.deltaY!==0){
                    e.preventDefault();
                    el.scrollLeft += e.deltaY * 0.25;
                }
            },{passive:false});
        });
    };

    renderList();

    form.addEventListener("submit", async e=>{
        e.preventDefault();
        const id = new FormData(form).get("urlInput").slice(-6);

        const res = await fetch("/check",{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body:JSON.stringify({ url:id })
        });

        const data = await res.json();

        if (res.ok) {
            myUrlsErr.style.display = "none";
            const list = JSON.parse(localStorage.getItem("myShortUrls") || "[]");
            const newItem = {
                short: `${window.location.origin}/dir/${id}`,
                original: data.original
            };

            if (!list.some(u => u.short === newItem.short)) {
                list.push(newItem);
                localStorage.setItem("myShortUrls", JSON.stringify(list));
                renderList();
                form.reset();
            } else {
                myUrlsErr.textContent = "This URL is already in your list.";
                myUrlsErr.style.display = "block";
            }
        } else {
            myUrlsErr.textContent = data.error || "URL not found.";
            myUrlsErr.style.display = "block";
        }
    });
}

// checkUrl.html
if(window.location.pathname === "/checkUrl.html"){
    const form = document.getElementById("form");
    const display = document.getElementById("display");
    const linkATag = document.getElementById("linkATag");
    const copyLink = document.getElementById("copyLink");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        let url = formData.get("urlInput");

        url = url.slice(-6);
        console.log(`URL entered: ${url}`);

        const response = await fetch("/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        const fetchData = await response.json();

        if (response.ok) {
            display.textContent = fetchData.original;
            linkATag.href = fetchData.original;
            display.style.display = "block";
            copyLink.style.display = "inline-block";
            display.classList.remove("error-display");
            linkATag.classList.remove("error-link");
        } else {
            display.textContent = fetchData.error || "URL not found.";
            display.style.display = "block";
            display.classList.add("error-display");
            linkATag.classList.add("error-link");
        }
    });
    
    copyLink.dataset.copyLabel = "Copy Original Link";
    copyLink.addEventListener("click", () => {
        navigator.clipboard.writeText(display.textContent);
        copyLink.textContent = "Copied!";
        setTimeout(() => { copyLink.textContent = "Copy Original Link"; }, 1500);
    });
}

// Functions
// Copy button
function copyBtnClicked(element, str) {
    element.addEventListener("click", () => {
        navigator.clipboard.writeText(str);
        element.textContent = "Copied!";
        setTimeout(() => { element.textContent = element.dataset.copyLabel || "Copy Link"; }, 1500);
    });
}