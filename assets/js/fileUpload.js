/*
Fullscreen Drag'n'Drop Image Upload written in vanilla javascript.
No external libraries required.
*/
(function() {

    const { open } = require('rosbag');

    // FormData or FileReader not available
    if (!('FormData' in window && 'FileReader' in window)) return;

    // declare private variables and/or functions
    let d = document;
    let overlay = d.querySelector('#overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay';
        overlay.innerHTML = '<div class="inneroverlay" style="width:30%;"><p>Drag\'n\'Drop a file here</p></div>';
        d.body.appendChild(overlay);
    }
    let uploadButton = d.querySelector('#upload');
    let fileReq = d.querySelector('#file');
    let validMimeTypes = ['image/gif','image/png','image/jpeg','image/svg+xml'];
    let output = d.querySelector('#output');

    /**
     * Displays thumbnail of uploaded image in browser
     *
     * @param  string   filename The name of the file uploaded
     * @param  string   file The data of the file uploaded
     *
     * @return void
     */
    let uploadFile = function(filename, file) {

        let li = document.createElement('li');
        li.setAttribute('title', 'Click to remove element from list');
        let img = document.createElement('img');
        img.setAttribute('src', file);
        img.setAttribute('title', filename);
        li.appendChild(img);
        let txt = document.createElement('span');
        txt.textContent = filename;
        li.appendChild(txt);
        output.appendChild(li);

        setTimeout(function() {
            this.classList.add('show');
        }.bind(li), 10)

        //uploadFileToServer(filename, file);
    }

    /**
     * Upload file to server
     *
     * @param  string   filename The name of the file uploaded
     * @param  string   file The data of the file uploaded
     *
     * @return void
     */
    let uploadFileToServer = function(filename, file) {
        let formdata = new FormData();
        formdata.append('name', filename);
        formdata.append('file', file);

        let xhr = new XMLHttpRequest();
        xhr.open('POST','upload.php', true);
        xhr.onprogress = function(e) {
            if (e.lengthComputable) {
                let percentage = Math.round((e.loaded/e.total)*100);
                //console.log("percent " + percentage + '%' );
            }
        }
        xhr.send(formdata);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                // get result back
                let result = xhr.responseText;
                try {
                    result = JSON.parse(result)
                    //alert(result['msg']);
                }
                catch(err) {
                    console.log(err, result);
                    return false;
                }
            }
        }
    }

    /**
     * Simulate mouseclick on element
     *
     * @param  object   el DOM element
     *
     * @return void
     */
    let simulateClick = function(el) {
        el.dispatchEvent(new MouseEvent('click', {
            'view': window,
            'bubbles': true,
            'cancelable': true
        }));
    }

    /**
     * Drag handler attached to document
     *
     * @param  object   e the event
     *
     * @return void
     */
    let documentDragHandler = function(e) {

        e.preventDefault();
        switch (e.type) {
            case 'dragenter':
                overlay.classList.add('active');
                break;
            case 'dragleave':
                overlay.classList.remove('active');
                break;
        }
    }

    /**
     * Drag handler attached to overlay
     *
     * @param  object   e the event
     *
     * @return void
     */
    let overlayDragHandler = function(e) {

        e.preventDefault();
        e.stopPropagation();
        switch (e.type) {
            case 'dragenter':
                d.removeEventListener('dragleave', documentDragHandler);
                break;
            case 'dragleave': {
                overlay.classList.remove('active');
                d.addEventListener('dragleave', documentDragHandler);
                break;
            }
            case 'drop': {
                overlay.classList.remove('active');
                d.addEventListener('dragleave', documentDragHandler);
                uploadHandler(e);
                break;
            }
        }
    }

    /**
     * Upload handler
     *
     * @param  object   e The DOM object
     *
     * @return void
     */
     function uploadHandler(e) {
        let l, i, files = e.target.files || e.dataTransfer.files;
        if (l = files.length) {
            for (i=0;i<l;i++) {
                let file = files[i];
                console.log(files[i])
                if (file.name.includes('.bag')) {
                    //todo: create rosbag handler
                    console.log('logMessagesFromFooBar')
                    logMessagesFromFooBar(file.path)
                }
                else {
                    // wrong file type
                    wrongFormat(file.name + ' is not an rosbag!');
                }
            }
        }
    }

    /**
     * Log messages from rosbag
     * @param file
     * @return {Promise<void>}
     */
    async function logMessagesFromFooBar(file) {
        // open a new bag at a given file location:
        console.log(file)
        const bag = await open(file);

        // read all messages from both the '/foo' and '/bar' topics:
        await bag.readMessages({ topics: ['/foo', '/bar'] }, (result) => {
            // topic is the topic the data record was in
            // in this case it will be either '/foo' or '/bar'
            console.log(result.topic);

            // message is the parsed payload
            // this payload will likely differ based on the topic
            console.log(result.message);
        });
    }

    /**
     * Display alert if format of uploaded file is not valid
     *
     * @param  string   text Error text to display
     *
     * @return void
     */
    let wrongFormat = function(text) {
        alert(text);
    }

    /**
     * Find and return the correct browser specific "transitionend"
     *
     * @return string
     */
    let whichTransitionEvent = function() {
        let t, el = document.createElement("fakeelement");
        let transitions = {
            "transition"      : "transitionend",
            "OTransition"     : "oTransitionEnd",
            "MozTransition"   : "transitionend",
            "WebkitTransition": "webkitTransitionEnd"
        }

        for (t in transitions) {
            if (el.style[t] !== undefined) {
                return transitions[t];
            }
        }
    }

    /**
     * remove element from list
     *
     * @return void
     */
    let removeElementFromList = function(e) {
        let node = e.target;
        let myScript = function(e) {
            if (e.propertyName == 'opacity') {
                output.removeChild(node);
            }
        }

        while (node != d) {
            if (node.matches('li.show')) {
                let transitionEvent = whichTransitionEvent();
                node.addEventListener(transitionEvent, myScript);
                node.classList.remove('show');
                break;
            };
            node = node.parentNode;
        }

    }

    // Attach events to document object
    d.addEventListener('dragstart', documentDragHandler, false); // Prevent local objects from being drag/dropped
    d.addEventListener('dragover', documentDragHandler, false);
    d.addEventListener('dragenter', documentDragHandler, false);
    d.addEventListener('dragleave', documentDragHandler, false);

    // Attach events to overlay object
    overlay.addEventListener('dragover', overlayDragHandler, false);
    overlay.addEventListener('dragenter', overlayDragHandler, false);
    overlay.addEventListener('dragleave', overlayDragHandler, false);
    overlay.addEventListener('drop', overlayDragHandler, false);

    output.addEventListener('click', removeElementFromList, false);

    // If 'standard' input type="file" element is found, attach 'change' event to it
    // Also attach 'click' event to button if present.
    if (fileReq) {
        fileReq.addEventListener('change', uploadHandler, false);
        if (uploadButton) uploadButton.addEventListener('click', simulateClick.bind(null, fileReq), false);
    }

    return {
        // declare public variables and/or functions
    }

})();
