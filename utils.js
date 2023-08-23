export function getRoomName(userId1, userId2) {
    let ids =[];
    if(userId1 > userId2){
        ids = [userId2 , userId1];
    }
    else{
        ids = [userId1, userId2];     
    }
      const roomName = `${ids[0]}_${ids[1]}`;
    return roomName;
}