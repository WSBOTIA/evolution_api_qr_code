'use client'

import { useEffect, useState } from "react";
import React from 'react';
import { 
  CToast, CToastBody, CToastClose, CToaster, CContainer, CRow, CCol, 
  CForm, CFormLabel, CFormSelect, CFormInput, CButton, CImage 
} from '@coreui/react';
import { connectionState, fetchInstances, getQr } from "./services/evolution.api.service";
import { getCountryCodes } from "./services/country.codes";

export default function Home() {
  const countryList = getCountryCodes();
  const [countryCode, setCountryCode] = useState(countryList[0].code);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [toasts, setToasts] = useState([]);
  const [qr, setQR] = useState('/qr_code.jpg');
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [instances, setInstances] = useState([]);

  useEffect(() => {
    const loadInstances = async () => {
      try {
        const { success, response } = await fetchInstances();
        if (success) {
          setInstances(response.data);
          showToast(response.msg, 'success');
        } else {
          showToast("Error al obtener las instancias", 'danger');
        }
      } catch (error) {
        console.error(error);
        showToast("Error de conexión", 'danger');
      }
    };
    loadInstances();
  }, []);

  useEffect(() => {
    let interval;
    if (selectedInstance && (selectedInstance.state === 'close' || selectedInstance.state === 'connecting')) {
      interval = setInterval(async () => {
        const { success, response } = await getQr(selectedInstance.name);
        if (success) {
          setQR(response.data.base64);
        } else {
          showToast("Error al actualizar el código QR", 'danger');
        }
      }, 45000);
    }
    return () => clearInterval(interval);
  }, [selectedInstance]);

  const showToast = (message, color) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, color, visible: true }]);
    setTimeout(() => setToasts((prevToasts) => prevToasts.filter(t => t.id !== id)), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalNumber = `${countryCode}${phoneNumber}`;
    const foundInstance = instances.find(instance => instance.number === finalNumber);

    if (foundInstance) {
      setSelectedInstance(foundInstance);
      showToast(`Número ${finalNumber} encontrado ✅`, 'success');

      try {
        const { success, response } = await connectionState(foundInstance.name);
        if (success) {
          const instanceState = response.data.instance.state;
          setSelectedInstance(prev => ({ ...prev, state: instanceState }));
          
          if (instanceState === 'close' || instanceState === 'connecting') {
            const { success: qrSuccess, response: qrResponse } = await getQr(foundInstance.name);
            if (qrSuccess) {
              setQR(qrResponse.data.base64);
            } else {
              showToast("Error al obtener el código QR", 'danger');
            }
          }
        } else {
          showToast("Error al obtener el estado de conexión", 'danger');
        }
      } catch (error) {
        console.error(error);
        showToast("Error de conexión con la API", 'danger');
      }
    } else {
      showToast(`Número ${finalNumber} NO encontrado ❌`, 'danger');
    }
  };

  return (
    <>
      <CContainer className="vh-100 d-flex align-items-center justify-content-center">
        <CRow className="w-100">
          <CCol md={4} className="p-4 border-end">
            <h5>Ingrese su número</h5>
            <CForm onSubmit={handleSubmit}>
              <CFormLabel htmlFor="countrySelect">Código del País</CFormLabel>
              <CFormSelect id="countrySelect" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                {countryList.map(({ code, flag, name }) => (
                  <option key={code} value={code}>{flag} {name} (+{code})</option>
                ))}
              </CFormSelect>

              <CFormLabel htmlFor="phoneInput" className="mt-3">Número de Teléfono</CFormLabel>
              <CFormInput
                id="phoneInput"
                type="tel"
                placeholder="Ej: 4148315972"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/, ''))}
                maxLength={10}
              />

              <CButton type="submit" color="primary" className="mt-3 w-100">
                Enviar
              </CButton>
            </CForm>
          </CCol>

          <CCol md={8} className="p-4 d-flex flex-column align-items-center justify-content-center">
            {selectedInstance ? (
              <>
                <h2>Bienvenido {selectedInstance.name}</h2>
                {selectedInstance.state === 'close' || selectedInstance.state === 'connecting' ? (
                  <>
                    <p>Escanea el código QR para conectar con WhatsApp</p>
                    <CImage rounded src={qr} width={300} height={300} />
                  </>
                ) : (
                  <p>Ya estás conectado</p>
                )}
              </>
            ) : (
              <>
                <p>Ingrese un número para verificar su estado</p>
                <CImage rounded src={qr} width={300} height={300} />
              </>
            )}
          </CCol>
        </CRow>
      </CContainer>

      <CToaster placement="top-end">
        {toasts.map(({ id, message, color }) => (
          <CToast key={id} autohide visible color={color} className="text-white align-items-center">
            <div className="d-flex">
              <CToastBody>{message}</CToastBody>
              <CToastClose className="me-2 m-auto" onClick={() => setToasts(toasts.filter(t => t.id !== id))} />
            </div>
          </CToast>
        ))}
      </CToaster>
    </>
  );
}
