'use client'

import { connectionState, fetchInstances, getQr } from "./services/evolution.api.service";
import { useEffect, useState } from "react";
import React from 'react'
import { CToast, CToastBody, CToastClose, CToaster, CContainer, CRow, CCol, CForm, CFormLabel, CFormSelect, CFormInput, CButton, CImage } from '@coreui/react'
import { getCountryCodes } from "./services/country.codes";

export default function Home() {
  const countryList = getCountryCodes();
  const [countryCode, setCountryCode] = useState(countryList[0].code);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [toasts, setToasts] = useState([]);
  const [instances, setInstances] = useState([]); // Almacena las instancias
  const [qr, setQR] = useState('/qr_code.jpg')
  const [status, setStatus] = useState('')
  const [instanceName, setInstanceName] = useState()
  useEffect(() => {
    fetchInstances()
      .then(resp => {
        const { success, response } = resp;

        if (success) {
          setInstances(response.data); // Guardamos las instancias en el estado
          console.log(response.data)
          showToast(response.msg, 'success');
        } else {
          showToast("Ocurrió un error al obtener las instancias", 'danger');
        }
      })
      .catch(err => {
        console.error(err);
        showToast("Error de conexión", 'danger');
      });
  }, []); // Se ejecuta solo una vez al montar el componente


  const getConnectionStatus = (instance) => {
    return connectionState(instance)
  }


  // Función para mostrar un toast dinámico y ocultarlo después de un tiempo
  const showToast = (message, color) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, color, visible: true }]);

    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter(toast => toast.id !== id));
    }, 3000);
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    const finalNumber = `${countryCode}${phoneNumber}`;

    // Buscar en las instancias si ya existe
    const foundInstance = instances.find(instance => instance.number === finalNumber);

    if (foundInstance) {
      showToast(`Número ${finalNumber} encontrado en las instancias ✅`, 'success');
      setInstanceName(foundInstance.name)
      console.log("INSTANCE NAME ", instanceName)
      getConnectionStatus(foundInstance.name).then(resp => {
        console.log("Estado de conexion", resp)
        const { success, response } = resp
        if (success) {

          showToast(response.msg, 'success');
          const state = response.data.instance.state
          console.log("STATE ", state)
          setStatus(state)
          console.log(status)

          if (state === 'close' || state === 'connecting') {
            getQr(foundInstance.name).then(resp => {
              console.log("QR", resp)
              const { success, response } = resp
              if (success) {
                setQR(response.data.base64)
              } else {
                console.log("Error al obtener qr")
              }
            }).catch(err => {
              console.log(err)
            })
          } else {

          }


        } else {
          console.log("Error al obtener el estado de conexion")
        }



      }).catch(err => {
        console.log(err)
      })


    } else {
      showToast(`Número ${finalNumber} NO encontrado ❌`, 'danger');
    }
  };

  return (
    <>
      <CContainer className="vh-100 d-flex align-items-center justify-content-center">
        <CRow className="w-100">
          {/* Sección Izquierda - Formulario */}
          <CCol md={4} className="p-4 border-end align-items-center justify-content-center">
            <h5>Ingrese su número</h5>
            <CForm onSubmit={handleSubmit}>
              {/* Selector de País */}
              <CFormLabel htmlFor="countrySelect">Código del País</CFormLabel>
              <CFormSelect id="countrySelect" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                {countryList.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name} (+{country.code})
                  </option>
                ))}
              </CFormSelect>

              {/* Input del Teléfono */}
              <CFormLabel htmlFor="phoneInput" className="mt-3">Número de Teléfono</CFormLabel>
              <CFormInput
                id="phoneInput"
                type="tel"
                placeholder="Ej: 4148315972"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/, ''))} // Solo números
                maxLength={10}
              />

              {/* Botón de Enviar */}
              <CButton type="submit" color="primary" className="mt-3 w-100">
                Enviar
              </CButton>
            </CForm>
          </CCol>

          {/* Sección Derecha - Espacio Libre */}
          <CCol md={8} className="p-4 d-flex align-items-center justify-content-center">
            {
              status === 'close' || status === 'connecting' || status === '' ? (

                <CRow>
                  {
                    status !== '' ? (
                      <CCol md={12}>
                        <h2>Bienvenido {instanceName ? instanceName : ""}</h2>
                        <p>Escanea el codigo QR paa conectar con tu whatsapp</p>
                      </CCol>
                    ) : ""
                  }
                  <CCol md={12}>
                    <CImage align="start" rounded src={qr} width={300} height={300} />
                  </CCol>

                </CRow>

              ) : (
                <CCol md={12}>
                  <h2>Bienvenido {instanceName ? instanceName : ""}</h2>
                  <p>Ya estas conectado</p>
                </CCol>
              )
            }
          </CCol>
        </CRow>
      </CContainer>

      {/* TOAST NOTIFICATIONS */}
      <CToaster placement="top-end">
        {toasts.map((toast) => (
          <CToast key={toast.id} autohide={true} visible={toast.visible} color={toast.color} className="text-white align-items-center">
            <div className="d-flex">
              <CToastBody>{toast.message}</CToastBody>
              <CToastClose className="me-2 m-auto" onClick={() => setToasts(toasts.filter(t => t.id !== toast.id))} />
            </div>
          </CToast>
        ))}
      </CToaster>
    </>
  );
}
