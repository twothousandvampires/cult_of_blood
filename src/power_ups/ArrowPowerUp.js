import PowerUp from "./PowerUp.js";

export default class ArrowPowerUp extends PowerUp{
    constructor() {
        super();
        this.texture_id = 'arrow_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }

    pickUp(player){
        player.ammo += 5
    }
}