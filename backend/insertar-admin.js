//USE crm_incidentes;
//
//-- Eliminar admin anterior si existe (opcional)
//DELETE FROM administradores WHERE cuit = '20123456789';
//
//-- Crear administrador
//-- CUIT: 20123456789
//-- Password: Admin123!
//INSERT INTO administradores (nombre, apellido, email, cuit, password, rol) VALUES
//('Admin', 'Sistema', 'admin@crm.com', '20123456789', '$2b$10$5ZxF4PD8LOStwf.5q2J99uVV4H6u/GrF73bKuzEgQvRfc6xKzEMby', 'admin');
//
//-- Verificar que se creó correctamente
//SELECT * FROM administradores WHERE cuit = '20123456789';


//corriendo este script te podes levantar un user admin en tu bd local