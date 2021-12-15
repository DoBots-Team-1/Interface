class stream {
    ROSLIB = require('roslib')
    port = 9090;
    // Socket connection
    ros = new this.ROSLIB.Ros({
        url : `ws://localhost:${this.port}`
    });
    // Renderer
    viewer = new ROS3D.Viewer({
        divID : 'viewer',
        background: '#ffffff',
        width : 50,
        height : 50,
        antialias : true,
        alpha : 0.1
    });
    // Camera stream topic
    cameraStream = new this.ROSLIB.Topic({
        ros : this.ros,
        name : '/camera/image_raw',
        messageType : 'sensor_msgs/Image'
    });
    // TF Client
    tfClient = new ROSLIB.TFClient({
        ros : this.ros,
        angularThres : 0.01,
        transThres : 0.01,
        rate : 10.0,
        fixedFrame : 'base_link'
    });

    display = document.getElementById('viewer')
    cameraCanvas = document.createElement("canvas");
    ctx = this.cameraCanvas.getContext("2d");

    constructor() {
        // Initializes connection
        this.createConnection(this.port)
            .then(() => this.init())
            .catch((e) => {console.log(`error:${e.message}`)});
        // Initializes connection
        this.renderPointCloud()
            // Render camera
            .then(() => this.cameraStream.subscribe((message) => this.renderFrames(message)))
            .catch((e) => {console.log(`error:${e.message}`)});
    }

    /**
     * Sends one request to initialize the camera stream resolution
     */
    init()
    {
        this.cameraCanvas.setAttribute('id', 'camera');
        this.display.children[0].setAttribute('id', 'lidar');
        let initCameraStream = new this.ROSLIB.Topic({
            ros : this.ros,
            name : '/camera/image_raw',
            messageType : 'sensor_msgs/Image'
        });

        initCameraStream.subscribe((message) => {
            console.info('Initializing the camera stream..');
            console.info(`Resolution:${message.width} x ${ message.height} `);
            this.viewer.renderer.setSize(message.width, message.height);
            this.cameraCanvas.width = message.width;
            this.cameraCanvas.height = message.height;
            initCameraStream.unsubscribe();
        })
    }

    /**
     * Decodes byte string data to binary and  camera frames to canvas
     * @param message
     */
    renderFrames(message)
    {
        const imgData = this.ctx.createImageData(message.width, message.height);
        const data = imgData.data;
        const inData = atob(message.data);

        let j = 0; let i = 4; // j data in , i data out
        while( j < inData.length) {
            const w1 = inData.charCodeAt(j++);  // read 3 16 bit words represent 1 pixel
            const w2 = inData.charCodeAt(j++);
            const w3 = inData.charCodeAt(j++);
            if (!message.is_bigendian) {
                data[i++] = w1; // red
                data[i++] = w2; // green
                data[i++] = w3; // blue
            } else {
                data[i++] = (w1 >> 8) + ((w1 & 0xFF) << 8);
                data[i++] = (w2 >> 8) + ((w2 & 0xFF) << 8);
                data[i++] = (w3 >> 8) + ((w3 & 0xFF) << 8);
            }
            data[i++] = 255;  // alpha
        }

        this.ctx.putImageData(imgData, 0, 0);
        this.display.appendChild(this.cameraCanvas);
        this.cameraStream.unsubscribe();
    }

    /**
     * Create point cloud visualisation
     * Using ROS3D Libary
     */
    async renderPointCloud()
    {
        const cloudClient = await new ROS3D.PointCloud2({
            ros: this.ros,
            topic: '/velodyne_points',
            tfClient: this.tfClient,
            rootObject: this.viewer.scene,
            material: { size: 0.05, color: 0xff00ff }
        });
    }

    /**
     * Creates connection to websocket
     * @param port
     */
    createConnection(port)
    {
        //todo: passing port number to console log
        return new Promise((resolve, reject) =>
        {
            this.ros.on('connection', function() {
                console.log(`Connected to websocket server.`)
                resolve()
            });

            this.ros.on('error', function(error, port) {
                console.log(`Error connecting to websocket server.`, error)
                reject()
            });

            this.ros.on('close', function(port) {
                console.log(`Connection to websocket server closed.`)
                reject()
            });

        })
    }
}
new stream()
