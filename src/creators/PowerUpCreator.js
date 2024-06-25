import BallLightningPowerUp from "../power_ups/BallLightningPowerUp.js";
import ArrowPowerUp from "../power_ups/ArrowPowerUp.js";
import SpeedPowerUp from "../power_ups/SpeedPowerUp.js";
import LifePowerUp from "../power_ups/LifePowerUp.js";
import PowerPowerUp from "../power_ups/PowerPowerUp.js";
import DarkSkullPowerUp from "../power_ups/DarkSkullPowerUp.js";
import RailLightningPowerUp from "../power_ups/RailLightningPowerUp.js";
import IceShardPowerUp from "../power_ups/IceShardPowerUp.js";
import ArmourPowerUp from "../power_ups/ArmourPowerUp.js";
import FireballPowerUp from "../power_ups/FIreballPowerUp.js";

export default class PowerUpCreator{
    static PU_LIST = [
        'ball_lightning_pu',
        // 'arrow_pu',
        // 'armour_pu',
        // 'speed_pu',
        // 'life_pu',
        // 'power_pu',
        'dark_skull_pu',
        'rail_lightning',
        'ice_shard',
        'fireball_pu'
    ]
    static create(texture_id){
        switch (texture_id){
            case 'ball_lightning_pu':
                return new BallLightningPowerUp()
            case 'arrow_pu':
                return new ArrowPowerUp()
            case 'armour_pu':
                return new ArmourPowerUp()
            case 'speed_pu':
                return new SpeedPowerUp()
            case 'life_pu':
                return new LifePowerUp()
            case 'power_pu':
                return new PowerPowerUp()
            case 'dark_skull_pu':
                return new DarkSkullPowerUp()
            case 'rail_lightning':
                return new RailLightningPowerUp()
            case 'ice_shard':
                return new IceShardPowerUp()
            case 'fireball_pu':
                return new FireballPowerUp()
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