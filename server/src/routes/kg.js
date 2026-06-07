const express = require('express');
const kgController = require('../controllers/kgController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware.authenticate);

router.get('/', kgController.getGraph);
router.post('/refresh', kgController.refreshGraph);
router.get('/export', kgController.exportData);
router.get('/nodes/:nodeId', kgController.getNodeDetail);
router.put('/nodes/:nodeId', kgController.updateNode);
router.patch('/nodes/:nodeId/hidden', kgController.toggleNodeHidden);
router.post('/nodes/:nodeId/annotations', kgController.addAnnotation);
router.delete('/nodes/:nodeId/annotations/:annotationId', kgController.removeAnnotation);
router.post('/edges', kgController.addManualEdge);
router.delete('/edges/:edgeId', kgController.removeEdge);

module.exports = router;
