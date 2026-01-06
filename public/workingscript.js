console.log("Messages:")
    console.log("0 - No problems");
    console.log("1 - Could not receive URL or URL is blank");
    console.log("2 - URL not valid");

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
    const navItem1 = document.getElementById("nav-item1");
    const warningSymbol = document.getElementById("warningSymbol");
    const warningText = document.getElementById("warningText");
    navItem1.style.color = "#00d4ff";
    navItem1.style.backgroundColor = "#444";

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        let url = formData.get("urlInput");

        if(!url.startsWith("https://www.", 0)){
            url = "https://www." + url;
        }

        console.log(`URL entered: ${url}`);

        const response = await fetch("/new", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        const fetchData = await response.json();
        console.log(`Message: ${fetchData.message}`);
        console.log(`ID: ${fetchData.id}`);

        if(fetchData.message === 0){
            const finalUrl = `${window.location.origin}/dir/${fetchData.id}`;
            display.textContent = finalUrl;
            linkATag.href = finalUrl;
            display.style.display = "block";
            copyLink.style.display = "inline-block";
            warningText.style.display = "block";
            warningSymbol.style.display = "block";
        }
        else{
            display.textContent = "Original URL invalid";
            display.style.display = "block";
        }
    });

    copyLink.addEventListener("click", () => {
        navigator.clipboard.writeText(display.textContent);
        copyLink.textContent = "Copied!"
        setTimeout(() => {copyLink.textContent = "🗒️ Copy Link"}, 1500);
    });
}

// myUrls.html
if (window.location.pathname === "/myUrls.html") {
    const form = document.getElementById("form");
    const myUrlsErr = document.getElementById("myUrlsErr");
    const myUrlsContainer = document.getElementById("myUrlsContainer");
    const navItem2 = document.getElementById("nav-item2");
    
    navItem2.style.color = "#00d4ff";
    navItem2.style.backgroundColor = "#444";

    // Function to draw the list from LocalStorage
    const renderList = () => {
        myUrlsContainer.innerHTML = ""; // Clear current list
        const savedUrls = JSON.parse(localStorage.getItem("myShortUrls") || "[]");

        // Loop backwards to show newest at the top
        savedUrls.reverse().forEach(data => {
            const item = document.createElement("li");
            item.classList.add("urlItem");

            const flexWrap = document.createElement("div");
            flexWrap.classList.add("url-flex-wrapper");

            const textWrap = document.createElement("div");
            textWrap.classList.add("urlText");

            const shortA = document.createElement("a");
            shortA.href = data.short;
            shortA.textContent = data.short;
            shortA.classList.add("MyUrlsUrlDisplay");

            const origA = document.createElement("a");
            origA.href = data.original;
            origA.textContent = data.original;
            origA.classList.add("originalUrlDisplay");

            const btn = document.createElement("button");
            btn.textContent = "🗒️ Copy";
            btn.classList.add("btn", "btn-outline-primary", "copyBtn");
            
            btn.addEventListener("click", () => {
                navigator.clipboard.writeText(data.short);
                btn.textContent = "Copied!";
                setTimeout(() => btn.textContent = "🗒️ Copy", 1200);
            });

            textWrap.appendChild(shortA);
            textWrap.appendChild(origA);
            flexWrap.appendChild(textWrap);
            flexWrap.appendChild(btn);
            item.appendChild(flexWrap);
            myUrlsContainer.appendChild(item);
        });
    };

    // Initial render when page opens
    renderList();

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        let urlInput = formData.get("urlInput");
        
        // Grab the last 6 chars (the ID)
        const id = urlInput.slice(-6);

        const response = await fetch("/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: id })
        });

        const fetchData = await response.json();

        if (fetchData.message === 0) {
            myUrlsErr.style.display = "none";
            
            // Prepare the new data object
            const newUrlData = {
                short: `${window.location.origin}/dir/${id}`,
                original: fetchData.original
            };

            // Save to LocalStorage Array
            const savedUrls = JSON.parse(localStorage.getItem("myShortUrls") || "[]");
            
            // Optional: Prevent duplicate saves
            if (!savedUrls.some(u => u.short === newUrlData.short)) {
                savedUrls.push(newUrlData);
                localStorage.setItem("myShortUrls", JSON.stringify(savedUrls));
                // Refresh the display
                renderList();
                form.reset();
            }
            else{
                myUrlsErr.textContent = "The URL you gave is already in your list.";
                myUrlsErr.style.display = "block";
                return;
            }
        } else {
            myUrlsErr.textContent = "URL does not exist.";
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
    const navItem3 = document.getElementById("nav-item3");
    navItem3.style.color = "#00d4ff";
    navItem3.style.backgroundColor = "#444";

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
        console.log(`Message: ${fetchData.message}`);
        console.log(`Original URL: ${fetchData.original}`);

        if(fetchData.message === 0){
            const originalUrl = fetchData.original;
            display.textContent = originalUrl;
            linkATag.href = originalUrl;
            display.style.display = "block";
            copyLink.style.display = "inline-block";
        }
        else{
            display.textContent = "Original URL invalid";
            display.style.display = "block";
        }
    });
    
    copyLink.addEventListener("click", () => {
        navigator.clipboard.writeText(display.textContent);
        copyLink.textContent = "Copied!"
        const timeoutId = setTimeout(() => {copyLink.textContent = "🗒️ Copy Link"}, 1500);
    });
}