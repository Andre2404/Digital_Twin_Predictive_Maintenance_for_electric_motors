# 3D Models Directory

Tempatkan file 3D model motor Anda di sini.

## Format yang didukung:
- `.glb` (disarankan - format binary GLTF)
- `.gltf` (format text GLTF)
- `.obj` + `.mtl`
- `.fbx`
- `.stl`

## Contoh struktur:
```
public/
  models/
    motor.glb          ← File 3D model motor utama
    motor-textured.glb ← Versi dengan texture
```

## Cara menggunakan:
Setelah file ditaruh di sini, bisa diakses via:
- URL: `/models/motor.glb`
- Atau di code: `'/models/motor.glb'`

