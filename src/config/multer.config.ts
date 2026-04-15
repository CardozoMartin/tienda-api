import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
  },
  fileFilter: (_req, file, cb) => {
    // Permitir imágenes y archivos Excel
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes o archivos Excel (.xlsx, .xls)'));
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
