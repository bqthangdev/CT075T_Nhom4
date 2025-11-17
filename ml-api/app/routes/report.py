"""
Report Generation Routes
Handles PDF report generation for medical diagnostics
"""
from flask import Blueprint, request, jsonify, send_file, current_app
from ..services.report_service import report_service

report_bp = Blueprint('report', __name__)


@report_bp.post('/generate')
def generate_report():
    """
    Generate diagnostic report PDF
    
    Expected JSON payload:
    {
        "patientData": { ... patient information ... },
        "predictionResult": { ... ML prediction results ... }
    }
    
    Returns:
        PDF file for download
    """
    limiter = current_app.limiter
    # Apply rate limit: 20 reports per minute per IP
    limiter.limit("20 per minute")(lambda: None)()
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        patient_data = data.get('patientData')
        prediction_result = data.get('predictionResult')
        
        # Debug: Print patient data keys
        print(f"[Report] Patient data keys: {patient_data.keys() if patient_data else 'None'}")
        print(f"[Report] citizenId value: {patient_data.get('citizenId', 'NOT FOUND')}")
        print(f"[Report] patientId value: {patient_data.get('patientId', 'NOT FOUND')}")
        
        if not patient_data or not prediction_result:
            return jsonify({'error': 'Missing patientData or predictionResult'}), 400
        
        # Generate PDF report
        pdf_buffer = report_service.generate_report(patient_data, prediction_result)
        
        # Create filename with timestamp
        from datetime import datetime
        filename = f"Bao_cao_chan_doan_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        # Return PDF file
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        print(f"[Report] Error generating report: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to generate report: {str(e)}'}), 500


@report_bp.get('/test')
def test_report():
    """Test endpoint to verify report service is working"""
    return jsonify({
        'status': 'ok',
        'message': 'Report service is ready',
        'endpoint': '/api/v1/report/generate'
    })
