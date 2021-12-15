
class stream {
    ROSLIB = require('roslib')
    port = 9090;
    ros = new this.ROSLIB.Ros({
        url : `ws://localhost:${this.port}`
    });
    cameraStream = new this.ROSLIB.Topic({
        ros : this.ros,
        name : '/camera/image_raw',
        messageType : 'sensor_msgs/Image'
    });
    // Create the main viewer.
    viewer = new ROS3D.Viewer({
        divID : 'viewer',
        background: '#0',
        width : 1980,
        height : 1080,
        antialias : true
    });

    tfClient = new ROSLIB.TFClient({
        ros : this.ros,
        angularThres : 0.01,
        transThres : 0.01,
        rate : 10.0,
        fixedFrame : 'base_link'
    });

    cameraCanvas = document.createElement("canvas");
    ctx = this.cameraCanvas.getContext("2d");

    constructor() {
        //todo: Creating play rosbag functionality

        this.createConnection(this.port)
            .then(() => this.renderPointCloud())
            .then(this.cameraStream.subscribe((message) => this.renderFrames(message)))
            .catch((e) => {console.log(`error:${e}`)})// Initializes connection
    }

    /**
     * Renders camera frames to canvas
     * @param message
     */
    renderFrames(message)
    {
        this.cameraCanvas.width = message.width;
        this.cameraCanvas.height = message.height;

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
        document.body.appendChild(this.cameraCanvas);
        this.cameraStream.unsubscribe();
    }

    /**
     * Create point cloud visualisation
     */
    renderPointCloud()
    {
        const cloudClient = new ROS3D.PointCloud2({
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
            this.ros.on('connection', function(port) {
                resolve(console.log(`Connected to websocket server on port ${port}.`))
            });

            this.ros.on('error', function(error, port) {
                reject(console.log(`Error connecting to websocket server:  ${port}.`, error));
            });

            this.ros.on('close', function(port) {
                reject(console.log(`Connection to websocket server closed on port ${port}`));
            });

        })



    }
}
new stream()
