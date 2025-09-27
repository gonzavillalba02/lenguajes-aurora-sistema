-- Crear base de datos
CREATE DATABASE IF NOT EXISTS aurora;
USE aurora;

-- Tabla ROL
CREATE TABLE rol (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

INSERT INTO rol (nombre) VALUES ('operador'), ('administrador');

-- Tabla USUARIO
CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni INT UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (rol_id) REFERENCES rol(id)
);

-- Tabla ESTADO_RESERVA
CREATE TABLE estado_reserva (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

INSERT INTO estado_reserva (nombre) VALUES
('pendiente_verificacion'),
('pendiente_pago'),
('aprobada'),
('rechazada'),
('cancelada');

-- Tabla TIPO_HABITACION
CREATE TABLE tipo_habitacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    capacidad INT NOT NULL,
    descripcion VARCHAR(255),
    precio_noche DECIMAL(10,2) NOT NULL
);

INSERT INTO tipo_habitacion (nombre, capacidad, descripcion, precio_noche) VALUES
('parejas_estandar', 2, 'Habitación estándar para dos personas', 100.00),
('parejas_suit', 2, 'Suite para dos personas con mayor confort', 200.00),
('cuadruple_estandar', 4, 'Habitación estándar para cuatro personas', 200.00),
('cuadruple_suit', 4, 'Suite para cuatro personas con mayor espacio y comodidades', 300.00),
('familiar_estandar', 6, 'Habitación estándar para familias de hasta seis integrantes', 300.00),
('familiar_suit', 6, 'Suite familiar con espacio y confort para seis integrantes', 400.00);

-- Tabla HABITACION
CREATE TABLE habitacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    tipo_id INT NOT NULL,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    observaciones VARCHAR(255),
    FOREIGN KEY (tipo_id) REFERENCES tipo_habitacion(id)
);

-- Tabla PERSONA
CREATE TABLE persona (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(255), -- se puede guardar la dirección o un JSON con coords
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20)
);

-- Tabla RESERVA
CREATE TABLE reserva (
    id INT AUTO_INCREMENT PRIMARY KEY,
    persona_id INT NOT NULL,
    habitacion_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado_id INT NOT NULL,
    observaciones VARCHAR(255),
    creada_por INT,
    aprobada_por INT,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (persona_id) REFERENCES persona(id),
    FOREIGN KEY (habitacion_id) REFERENCES habitacion(id),
    FOREIGN KEY (estado_id) REFERENCES estado_reserva(id),
    FOREIGN KEY (creada_por) REFERENCES usuario(id),
    FOREIGN KEY (aprobada_por) REFERENCES usuario(id)
);

-- Tabla ESTADO_CONSULTA
CREATE TABLE estado_consulta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

INSERT INTO estado_consulta (nombre) VALUES
('pendiente'),
('resuelta');

-- Tabla CONSULTA
CREATE TABLE consulta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texto VARCHAR(500) NOT NULL,
    persona_id INT NOT NULL,
    estado_id INT NOT NULL,
    resuelta_por INT,
    FOREIGN KEY (persona_id) REFERENCES persona(id),
    FOREIGN KEY (estado_id) REFERENCES estado_consulta(id),
    FOREIGN KEY (resuelta_por) REFERENCES usuario(id)
);
