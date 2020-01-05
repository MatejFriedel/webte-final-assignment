class Car extends JunctionObject {

    constructor(car) {
        super(car);
        this.color = COLORS[car.id];
        this.carOff = document.getElementById(this.color + BLINKER_OFF);
        this.carRight = document.getElementById(this.color + BLINKER_RIGHT);
        this.carLeft = document.getElementById(this.color + BLINKER_LEFT);
        this.layerVisibilityStates = [this.carOff, this.carRight, this.carLeft];
        this.blinker = car.blinker;

        this.isTurnedOff = this.exitBlinker = this.setDefaultBlinkers(car.blinker);
        this.startBlinker(car.blinker);
    }

    setIntervalAsync = async (fn, ms) => {
        if(this.exitBlinker) return;
        fn().then(() => setTimeout(() => {this.setIntervalAsync(fn, ms);}, ms));
    }

    async blinkBlinkers() {
        if (this.isTurnedOff)
            this.setDefaultBlinkers(this.blinker);
        else
            this.turnOffBlinkers();
        
        this.isTurnedOff = !this.isTurnedOff;
    }

    startBlinker() {
        this.setIntervalAsync(() => this.blinkBlinkers(this), BLINKER_LAYER_SWITCHING_DURATION);
    }

    stopBlinker() {
        this.exitBlinker = true;
        this.turnOffBlinkers();
    }

    setDefaultBlinkers(blinker = DEFAULT_BLINKER_STATE) {
        BLINKERS[blinker](this);
        return blinker == DEFAULT_BLINKER_STATE;
    }

    turnOffBlinkers() {
        this.setVisibilityLayerStates(["visible", "hidden", "hidden"]);
    }

    turnOnRightBlinker() {
        this.setVisibilityLayerStates(["hidden", "visible", "hidden"]);
    }

    turnOnLeftBlinker() {
        this.setVisibilityLayerStates(["hidden", "hidden", "visible"]);
    }

    hideCar() {
        this.setVisibilityLayerStates(["hidden", "hidden", "hidden"]);
    }

    showCar() {
        this.setVisibilityLayerStates(["visible", "hidden", "hidden"]);
    }

    async turnCarBasedOnAction(car, action) { 
        let carStartX = car.transformX;
        let carStartY = car.transformY;

        let quadrant = QUADRANTS[action.quadrant][action.clockwise ? "clockwise" : "counterclockwise"];

        for (let i = quadrant.start; i != (quadrant.end + quadrant.increment); i += quadrant.increment) {
            this.turnCar(car, i, action.distance, carStartX, carStartY, quadrant);            
            await this.sleep(TURN_ANIMATION_PAUSE_DURATION);
        }

        if(action.blinkersAfter == DEFAULT_BLINKER_STATE)
            this.stopBlinker();
        else {
            this.exitBlinker = this.isTurnedOff = this.setDefaultBlinkers(action.blinkersAfter);
            this.blinker = action.blinkersAfter;
            this.startBlinker();
        }      

    }

    turnCar(car, angle, distance, startX, startY, quadrant) {
        var centerX = startX + quadrant.vector[0] * CAR_HALF_WIDTH + quadrant.vector[1] * distance;
        var centerY = startY + quadrant.vector[2] * CAR_HALF_WIDTH + quadrant.vector[3] * distance;
        var x = centerX + Math.cos(-angle * Math.PI / 180) * (distance + CAR_HALF_WIDTH);
        var y = centerY + Math.sin(-angle * Math.PI / 180) * (distance + CAR_HALF_WIDTH);
        car.moveAbsolute(x, y);
        car.rotateAbsolute(quadrant.baseAngle + -1 * angle);
    }

    async turnCarBasedOnActionWithTrafficLight(object, action) {
        await this.turnCarBasedOnAction(object, action);
        action.trafficLightActions.forEach(trafficLightAction => {
            JUNCTION_OBJECTS[trafficLightAction.trafficLightId][trafficLightAction.trafficLightAction]();
        });
    }

    clearObjectRoutine() {
        this.stopBlinker();
    }

}