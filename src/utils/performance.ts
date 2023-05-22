export default class Performance {

    private static instance: Performance;

    private constructor() { }

    public static getInstance(): Performance {
        if (!Performance.instance) {
            Performance.instance = new Performance();
        }

        return Performance.instance;
    }

    private startTime;
    private endTime;

    public start() {
        this.startTime = performance.now();
    };

    public end() {
        this.endTime = performance.now();
        var timeDiff = this.endTime - this.startTime; //in ms 

        console.log('Elaboration completed in ' + Math.round(timeDiff) + " ms");
    }
}