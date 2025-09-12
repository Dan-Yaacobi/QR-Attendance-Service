import { getUserIdByDevice, getUserPhoneById, getUserNameByUserId } from '../db.js'
import { findParticipant, markParticipant } from './googlesheets.js';

export async function checkIn(courseId, deviceId){
  try{
    const userId = await getUserIdByDevice(deviceId)
    if(!userId){ // device ID does not match any user id

    }
    const userPhone = await getUserPhoneById(userId)
    const row = await findParticipant(courseId,userPhone)
    const mark = await markParticipant(row,courseId)
    if (mark == 0){
          const name = await getUserNameByUserId(userId)
          return {name: name, ok: true}
    }
    else if(mark == 1){
      return {name: 1, ok : false}
    }
    else{
          return {name: null, ok: false}
    }
  }
  catch(err){
    console.error(err)
    return {name: null, ok: false}
  }
}