import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
  },
  fileFilter: (req, file, cb) => {
    // Verificar que sea una imagen
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
});

export default upload;

export const uploadSucursalImages = upload.fields([
  { name: 'icono', maxCount: 1 }, // 1 icono
  { name: 'banners', maxCount: 5 }, // hasta 5 banners
]);

export const uploadSingle = upload.single('photo');
export const uploadMultiple = upload.array('carruselImagenes', 10); // Campo para imágenes del carrusel
