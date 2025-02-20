import axios from 'axios';
import CONFIG from '../config'
const fetchInstances = async () => {
    return new Promise(async (resolve, reject) => {
        try{
            const server = `${CONFIG.EVOLUTION_API_URL}:${CONFIG.EVOLUTION_API_PORT}`
            const uri = `${server}/instance/fetchInstances`
            axios.get(uri, {
                headers : {Apikey : CONFIG.EVOLUTION_API_KEY}
            }).then(response => {
                resolve({success : true, response : {msg : "Instancias obtenidas satisfactoriamente", data : response.data}})
            }).catch(err => {
                reject({success : false, response : {msg : "Ocurrio un error al consultar las instancias", error : JSON.stringify(err)}})
            })


        }catch(err){
            reject({success:false, response : {msg : "Ocurrion un error inesperado al obtener las instancias", error : JSON.stringify(err)}})
        }
    })
}


const getQr = async (name) => {
    return new Promise(async (resolve, reject) => {
        try{
            const server = `${CONFIG.EVOLUTION_API_URL}:${CONFIG.EVOLUTION_API_PORT}`
            const uri = `${server}/instance/connect/${name}`
            axios.get(uri, {
                headers : {Apikey : CONFIG.EVOLUTION_API_KEY}
            }).then(response => {
                resolve({success : true, response : {msg : "Codigo QR obtenido satisfactoriamente", data : response.data}})
            }).catch(err => {
                reject({success : false, response : {msg : "Ocurrio un error al obtener el codigo QR", error : JSON.stringify(err)}})
            })


        }catch(err){
            reject({success:false, response : {msg : "Ocurrion un error inesperado al obtener el codigo QR", error : JSON.stringify(err)}})
        }
    })
}




export {
    fetchInstances,
    getQr
}