from flask import Blueprint, request, current_app
from http import HTTPStatus
from ..services.prediction_service import PredictionService

predictions_bp = Blueprint('predictions', __name__)
service = PredictionService()


@predictions_bp.post('/predict')
def predict():
    limiter = current_app.limiter
    # Apply strict rate limit: 10 predictions per minute per IP to prevent spam
    limiter.limit("10 per minute")(lambda: None)()
    
    try:
        payload = request.get_json(force=True, silent=False) or {}
        result = service.predict(payload)
        return {
            'success': True,
            'data': result,
            'message': 'Prediction completed successfully'
        }, HTTPStatus.OK
    except ValueError as ve:
        return {
            'success': False,
            'errors': [str(ve)]
        }, HTTPStatus.BAD_REQUEST
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }, HTTPStatus.INTERNAL_SERVER_ERROR


@predictions_bp.get('/history')
def history():
    try:
        items = service.get_history()
        return {
            'success': True,
            'data': items
        }, HTTPStatus.OK
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }, HTTPStatus.INTERNAL_SERVER_ERROR


@predictions_bp.delete('/history/<int:index>')
def delete_history(index):
    try:
        success = service.delete_record(index)
        if success:
            return {
                'success': True,
                'message': 'History record deleted successfully'
            }, HTTPStatus.OK
        else:
            return {
                'success': False,
                'error': 'Invalid index or record not found'
            }, HTTPStatus.NOT_FOUND
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }, HTTPStatus.INTERNAL_SERVER_ERROR


@predictions_bp.post('/history/delete-multiple')
def delete_multiple_history():
    try:
        payload = request.get_json(force=True, silent=False) or {}
        indices = payload.get('indices', [])
        
        if not isinstance(indices, list) or not indices:
            return {
                'success': False,
                'error': 'Invalid or empty indices list'
            }, HTTPStatus.BAD_REQUEST
        
        success = service.delete_multiple_records(indices)
        if success:
            return {
                'success': True,
                'message': f'Deleted {len(indices)} history records successfully'
            }, HTTPStatus.OK
        else:
            return {
                'success': False,
                'error': 'Failed to delete records or invalid indices'
            }, HTTPStatus.BAD_REQUEST
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }, HTTPStatus.INTERNAL_SERVER_ERROR


@predictions_bp.delete('/history')
def clear_all_history():
    try:
        success = service.clear_all_history()
        if success:
            return {
                'success': True,
                'message': 'All history records deleted successfully'
            }, HTTPStatus.OK
        else:
            return {
                'success': False,
                'error': 'Failed to clear history'
            }, HTTPStatus.INTERNAL_SERVER_ERROR
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }, HTTPStatus.INTERNAL_SERVER_ERROR
