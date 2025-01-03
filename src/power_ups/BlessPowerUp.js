import PowerUp from "./PowerUp.js";

export default class BlessPowerUp extends PowerUp{
    constructor() {
        super()
        this.texture_id = 'bless_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }
    pickUp(player, io){
        if(player.is_beast) return

        player.blessed = true
    }
}