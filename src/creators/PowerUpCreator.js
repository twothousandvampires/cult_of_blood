import BallLightningPowerUp from "../power_ups/BallLightningPowerUp.js";
import ArrowPowerUp from "../power_ups/ArrowPowerUp.js";
import SpeedPowerUp from "../power_ups/SpeedPowerUp.js";
import LifePowerUp from "../power_ups/LifePowerUp.js";
import PowerPowerUp from "../power_ups/PowerPowerUp.js";
import DarkSkullPowerUp from "../power_ups/DarkSkullPowerUp.js";

export default class PowerUpCreator{
    static PU_LIST = [
        'ball_lightning_pu',
        'arrow_pu',
        'armour_pu',
        'speed_pu',
        'life_pu',
        'power_pu',
        'dark_skull_pu'
    ]
    static create(texture_id){
        switch (texture_id){
            case 'ball_lightning_pu':
                return new BallLightningPowerUp()
            case 'arrow_pu':
                return new ArrowPowerUp()
            case 'armour_pu':
                return new ArrowPowerUp()
            case 'speed_pu':
                return new SpeedPowerUp()
            case 'life':
                return new LifePowerUp()
            case 'power_pu':
                return new PowerPowerUp()
            case 'dark_skull_pu':
                return new DarkSkullPowerUp()
        }
    }

    static getPuNameRandom(){
        return PowerUpCreator.PU_LIST[Math.floor(Math.random() * PowerUpCreator.PU_LIST.length)]
    }

    static createRandom(){
        let r_name = PowerUpCreator.getPuNameRandom()
        return PowerUpCreator.create(r_name)
    }
}