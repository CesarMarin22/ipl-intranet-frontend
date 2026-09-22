export const AUDI_CLIENTE = {
  codigoCliente: "C00133",
  nombreCliente: "AUDI MEXICO",
  serie: "374",
  serieNombre: "PUE",
  vistoBuenoCliente: "ING MARTIN BARRIOS",
};

export const AUDI_TIPOS_ORDEN = [
  { value: "ZPM2", label: "PREVENTIVO", callType: "3" },
  { value: "ZPM3", label: "CORRECTIVO", callType: "15" },
  { value: "ZPM8", label: "AJUSTES", callType: "2" },
];

export const AUDI_TIPOS_PROBLEMA_PERMITIDOS = ["2", "7", "8", "11", "198"];

export const AUDI_DEFECTOS_PREFIJOS: Record<string, string[]> = {
  "2": ["EL:"],
  "7": ["H:"],
  "8": ["M:"],
  "198": ["E:"],
  "11": ["O:"],
};

export const AUDI_CAUSAS = [
  { code: "E:CONTACTOR", name: "CONTACTOR" },
  { code: "E:CONTROLADOR", name: "CONTROLADOR" },
  { code: "E:CONVERTIDOR", name: "CONVERTIDOR" },
  { code: "E:CPP", name: "CPP" },
  { code: "E:DISPLAY", name: "DISPLAY" },
  { code: "E:FRENO", name: "FRENO E" },
  { code: "E:FUSIBLES", name: "FUSIBLES E" },
  { code: "E:JOSTICK", name: "JOSTICK" },
  { code: "E:POTENCIOMENTRO", name: "POTENCIOMENTRO" },
  { code: "E:RCU", name: "RCU" },
  { code: "E:RELEVADORES", name: "RELEVADORES" },
  { code: "E:SENSOR", name: "SENSOR" },
  { code: "E:TARJETAS", name: "TARJETAS" },
  { code: "E:TIMON", name: "TIMON" },

  { code: "EL:ARNES", name: "ARNES" },
  { code: "EL:BATERIA", name: "BATERIA" },
  { code: "EL:BOTONERA", name: "BOTONERA" },
  { code: "EL:CABLE VIEJERO", name: "CABLE VIEJERO" },
  { code: "EL:CLAXON", name: "CLAXON" },
  { code: "EL:CONECTORES", name: "CONECTORES" },
  { code: "EL:FUSIBLES", name: "FUSIBLES" },
  { code: "EL:LUCES", name: "LUCES" },
  { code: "EL:MOTOR", name: "MOTOR" },

  { code: "H:BOMBA", name: "BOMBA" },
  { code: "H:CILINDRO", name: "CILINDRO" },
  { code: "H:CONEXIONES", name: "CONEXIONES" },
  { code: "H:ELECTRO VALVULAS", name: "ELECTRO VALVULAS" },
  { code: "H:RETENES", name: "RETENES" },
  { code: "H:SELLOS", name: "SELLOS" },
  { code: "H:VALVULAS", name: "VALVULAS" },

  { code: "M:ABRAZADERAS", name: "ABRAZADERAS" },
  { code: "M:ASIENTO", name: "ASIENTO" },
  { code: "M:BAQUELITAS", name: "BAQUELITAS" },
  { code: "M:BIRLOS / TORNILLERIA", name: "BIRLOS / TORNILLERIA" },
  { code: "M:CADENA", name: "CADENA" },
  { code: "M:CARRO PORTA HORQUILLAS", name: "CARRO PORTA HORQUILLAS" },
  { code: "M:EJE DE DIRECCION", name: "EJE DE DIRECCION" },
  { code: "M:EJE DE TRACCION", name: "EJE DE TRACCION" },
  { code: "M:FRENO", name: "FRENO" },
  { code: "M:HORQUILLAS", name: "HORQUILLAS" },
  { code: "M:LLAVIN", name: "LLAVIN" },
  { code: "M:POLEAS", name: "POLEAS" },
  { code: "M:RESORTE", name: "RESORTE" },
  { code: "M:RODAJAS", name: "RODAJAS" },
  { code: "M:RODAMIENTOS", name: "RODAMIENTOS" },
  { code: "M:ROTULAS / PERNOS", name: "ROTULAS / PERNOS" },
  { code: "M:RUEDAS", name: "RUEDAS" },
  { code: "M:SEGURO DE BATERIA", name: "SEGURO DE BATERIA" },
  { code: "M:SISTEMA DE ENGANCHE", name: "SISTEMA DE ENGANCHE" },
  { code: "M:VOLANTE", name: "VOLANTE" },

  { code: "O:BANDA ANTIESTATICA", name: "BANDA ANTIESTATICA" },
  { code: "O:CHASIS", name: "CHASIS" },
  { code: "O:CINTURON DE SEGURIDAD", name: "CINTURON DE SEGURIDAD" },
  { code: "O:ESPEJO", name: "ESPEJO" },
  { code: "O:PAREMETROS", name: "PAREMETROS" },
];

export const AUDI_TIPOS_DANIO = [
  { code: "E:CALIBRACION", name: "CALIBRACION E" },
  { code: "E:CODIGO DE ERROR", name: "CODIGO DE ERROR" },
  { code: "E:COMPONENTE INOPERANTE", name: "COMPONENTE INOPERANTE E" },

  { code: "EL:ARNES DANADO", name: "ARNES DANADO" },
  { code: "EL:COMPONENTE INOPERANTE", name: "COMPONENTE INOPERANTE EL" },
  { code: "EL:FALSO CONTACTO", name: "FALSO CONTACTO" },

  { code: "H:AJUSTE", name: "AJUSTE" },
  { code: "H:CALIBRACION", name: "CALIBRACION" },
  { code: "H:COMPONENTE INOPERANTE", name: "COMPONENTE INOPERANTE" },
  { code: "H:FUGA", name: "FUGA" },

  { code: "M:CALIBRACION", name: "CALIBRACION M" },
  { code: "M:DESGASTE NATURAL", name: "DESGASTE NATURAL" },
  { code: "M:FISURA", name: "FISURA" },
  { code: "M:FRACTURA", name: "FRACTURA" },
  { code: "M:RUIDOS INUSUALES", name: "RUIDOS INUSUALES" },

  { code: "O:CALIBRACION / AJUSTE", name: "CALIBRACION / AJUSTE" },
  { code: "O:DESGASTE NATURAL", name: "DESGASTE NATURAL O" },
  { code: "O:FRACTURA", name: "FRACTURA O" },
  { code: "O:GOLPE", name: "GOLPE" },
];

export function getAudiOptionsByDefecto(defectoId: string) {
  const prefijos = AUDI_DEFECTOS_PREFIJOS[defectoId] || [];

  return {
    causas: AUDI_CAUSAS.filter((item) =>
      prefijos.some((prefijo) => item.code.startsWith(prefijo)),
    ),
    tiposDanio: AUDI_TIPOS_DANIO.filter((item) =>
      prefijos.some((prefijo) => item.code.startsWith(prefijo)),
    ),
  };
}