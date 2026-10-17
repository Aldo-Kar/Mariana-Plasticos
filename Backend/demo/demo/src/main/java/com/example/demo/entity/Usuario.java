package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "Usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(name = "id_rol", nullable = false)
    private Integer idRol;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "correo", length = 100)
    private String correo;

    @Column(name = "contrasena", length = 255)
    private String contrasena;

    @Column(name = "estado", length = 20)
    private String estado;

    public Usuario() {}

    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }

    public Integer getIdRol() { return idRol; }
    public void setIdRol(Integer idRol) { this.idRol = idRol; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getContrasena() { return contrasena; }
    public void setContrasena(String contrasena) { this.contrasena = contrasena; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
