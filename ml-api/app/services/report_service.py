"""
Medical Diagnostic Report Generator Service
Generates professional medical reports in PDF format
"""
from datetime import datetime
from io import BytesIO
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os


class ReportService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._register_fonts()
        self._setup_custom_styles()

    def _register_fonts(self):
        """Register Unicode fonts that support Vietnamese"""
        try:
            import platform
            system = platform.system()
            
            if system == 'Windows':
                arial_path = 'C:/Windows/Fonts/arial.ttf'
                arialbd_path = 'C:/Windows/Fonts/arialbd.ttf'
                
                if os.path.exists(arial_path):
                    pdfmetrics.registerFont(TTFont('Arial', arial_path))
                    pdfmetrics.registerFont(TTFont('Arial-Bold', arialbd_path))
                    self.font_name = 'Arial'
                    self.font_name_bold = 'Arial-Bold'
                    print("[Report] Using Arial fonts for Vietnamese support")
                else:
                    raise Exception("Arial font not found")
            else:
                font_dir = os.path.join(os.path.dirname(__file__), '..', 'fonts')
                dejavu_path = os.path.join(font_dir, 'DejaVuSans.ttf')
                dejavu_bold_path = os.path.join(font_dir, 'DejaVuSans-Bold.ttf')
                
                if os.path.exists(dejavu_path):
                    pdfmetrics.registerFont(TTFont('DejaVuSans', dejavu_path))
                    pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', dejavu_bold_path))
                    self.font_name = 'DejaVuSans'
                    self.font_name_bold = 'DejaVuSans-Bold'
                    print("[Report] Using DejaVu fonts for Vietnamese support")
                else:
                    raise Exception("DejaVu font not found")
                    
        except Exception as e:
            print(f"[Report] Font registration error: {e}")
            print("[Report] Falling back to Helvetica (limited Vietnamese support)")
            self.font_name = 'Helvetica'
            self.font_name_bold = 'Helvetica-Bold'

    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='MainTitle',
            parent=self.styles['Title'],
            fontSize=18,
            textColor=colors.HexColor('#003366'),
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName=self.font_name_bold,
            leading=22
        ))
        
        self.styles.add(ParagraphStyle(
            name='Subtitle',
            parent=self.styles['Title'],
            fontSize=13,
            textColor=colors.HexColor('#003366'),
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName=self.font_name
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading1'],
            fontSize=13,
            textColor=colors.white,
            spaceAfter=12,
            spaceBefore=16,
            fontName=self.font_name_bold,
            leftIndent=10,
            leading=18
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            fontName=self.font_name,
            leading=14,
            alignment=TA_JUSTIFY
        ))
        
        self.styles.add(ParagraphStyle(
            name='InfoText',
            parent=self.styles['Normal'],
            fontSize=9,
            fontName=self.font_name,
            textColor=colors.HexColor('#666666'),
            leading=12
        ))
        
        self.styles.add(ParagraphStyle(
            name='BoldText',
            parent=self.styles['Normal'],
            fontSize=10,
            fontName=self.font_name_bold,
            leading=14
        ))

    def _get_risk_color(self, risk_level: str):
        """Get color based on risk level"""
        risk_colors = {
            'Low Risk': colors.HexColor('#52c41a'),
            'Medium Risk': colors.HexColor('#faad14'),
            'High Risk': colors.HexColor('#f5222d')
        }
        return risk_colors.get(risk_level, colors.grey)

    def _get_risk_label_vi(self, risk_level: str):
        """Get Vietnamese label for risk level"""
        labels = {
            'Low Risk': 'Nguy cơ thấp',
            'Medium Risk': 'Nguy cơ trung bình',
            'High Risk': 'Nguy cơ cao'
        }
        return labels.get(risk_level, risk_level)

    def _create_section_header(self, title: str):
        """Create a styled section header with background"""
        header_table = Table(
            [[Paragraph(f'<b>{title}</b>', self.styles['SectionHeader'])]],
            colWidths=[6.7*inch]
        )
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#333333')),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        return header_table

    def _format_patient_data(self, data: Dict[str, Any]) -> list:
        """Format patient data into two-column layout"""
        field_mapping = {
            'patientName': 'Họ và tên',
            'age': 'Tuổi',
            'gender': 'Giới tính',
            'everMarried': 'Hôn nhân',
            'workType': 'Nghề nghiệp',
            'residenceType': 'Nơi ở',
            'hypertension': 'Tăng huyết áp',
            'heartDisease': 'Bệnh tim',
            'smokingStatus': 'Hút thuốc',
            'avgGlucoseLevel': 'Glucose TB',
            'bmi': 'BMI'
        }
        
        value_mapping = {
            'gender': {'Male': 'Nam', 'Female': 'Nữ', 'Other': 'Khác'},
            'hypertension': {True: 'Có', False: 'Không', 'true': 'Có', 'false': 'Không', 'True': 'Có', 'False': 'Không', '1': 'Có', '0': 'Không', 1: 'Có', 0: 'Không'},
            'heartDisease': {True: 'Có', False: 'Không', 'true': 'Có', 'false': 'Không', 'True': 'Có', 'False': 'Không', '1': 'Có', '0': 'Không', 1: 'Có', 0: 'Không'},
            'everMarried': {'Yes': 'Có', 'No': 'Chưa'},
            'workType': {
                'Private': 'Tư nhân',
                'Self-employed': 'Tự do',
                'Govt_job': 'Công chức',
                'children': 'Trẻ em',
                'Never_worked': 'Chưa làm'
            },
            'residenceType': {'Urban': 'Thành thị', 'Rural': 'Nông thôn'},
            'smokingStatus': {
                'never smoked': 'Không',
                'formerly smoked': 'Đã bỏ',
                'smokes': 'Có',
                'Unknown': 'Không rõ'
            }
        }
        
        formatted = []
        
        # Add CCCD first (full width)
        citizen_id = data.get('citizenId') or data.get('patientId', 'N/A')
        formatted.append([Paragraph('<b>Số CCCD:</b>', self.styles['BoldText']), 
                         Paragraph(str(citizen_id), self.styles['CustomNormal']),
                         '', ''])
        
        # Process remaining fields in pairs
        keys = list(field_mapping.keys())
        for i in range(0, len(keys), 2):
            row = []
            for j in range(2):  # Two columns
                if i + j < len(keys):
                    key = keys[i + j]
                    label = field_mapping[key]
                    value = data.get(key, 'N/A')
                    
                    # Format value
                    if key in value_mapping:
                        if value in value_mapping[key]:
                            value = value_mapping[key][value]
                        else:
                            value = value_mapping[key].get(str(value), str(value))
                    
                    # Add units where needed
                    if key == 'avgGlucoseLevel':
                        value = f"{value} mg/dL"
                    
                    row.append(Paragraph(f'<b>{label}:</b>', self.styles['BoldText']))
                    row.append(Paragraph(str(value), self.styles['CustomNormal']))
                else:
                    row.extend(['', ''])
            formatted.append(row)
        
        return formatted

    def generate_report(self, patient_data: Dict[str, Any], prediction_result: Dict[str, Any]) -> BytesIO:
        """Generate medical diagnostic report PDF"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm,
            title="Báo cáo chẩn đoán"
        )
        
        elements = []
        
        # === HEADER SECTION ===
        # Load hospital info from environment
        hospital_name = os.getenv('HOSPITAL_NAME', 'BỆNH VIỆN ĐA KHOA TRUNG TÂM')
        hospital_dept = os.getenv('HOSPITAL_DEPARTMENT', 'Trung tâm Tim mạch & Thần kinh')
        
        elements.append(Paragraph(
            f'<b>{hospital_name}</b>',
            self.styles['MainTitle']
        ))
        elements.append(Paragraph(
            hospital_dept,
            self.styles['Subtitle']
        ))
        elements.append(Spacer(1, 0.3*cm))
        
        # Report title with border
        title_table = Table(
            [[Paragraph('<b>BÁO CÁO CHẨN ĐOÁN NGUY CƠ ĐỘT QUỴ</b>', self.styles['MainTitle'])]],
            colWidths=[6.7*inch]
        )
        title_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f5f5f5')),
            ('BOX', (0, 0), (-1, -1), 2, colors.black),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(title_table)
        elements.append(Spacer(1, 0.5*cm))
        
        # Report metadata
        report_date = datetime.now().strftime("%d/%m/%Y lúc %H:%M")
        report_code = f"DS-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        meta_data = [
            [Paragraph('<b>Mã báo cáo:</b>', self.styles['BoldText']), 
             Paragraph(report_code, self.styles['CustomNormal']),
             Paragraph('<b>Ngày tạo:</b>', self.styles['BoldText']), 
             Paragraph(report_date, self.styles['CustomNormal'])]
        ]
        meta_table = Table(meta_data, colWidths=[1.5*inch, 1.85*inch, 1.3*inch, 2.05*inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fafafa')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#d9d9d9')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d9d9d9')),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 0.6*cm))
        
        # === SECTION 1: PATIENT INFO ===
        elements.append(self._create_section_header('I. THÔNG TIN BỆNH NHÂN'))
        elements.append(Spacer(1, 0.3*cm))
        
        patient_table_data = self._format_patient_data(patient_data)
        patient_table = Table(
            patient_table_data, 
            colWidths=[1.4*inch, 1.95*inch, 1.4*inch, 1.95*inch]
        )
        patient_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d9d9d9')),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(patient_table)
        elements.append(Spacer(1, 0.6*cm))
        
        # === SECTION 2: DIAGNOSTIC RESULT ===
        risk_score = prediction_result.get('riskScore', 0)
        risk_level = prediction_result.get('riskLevel', 'Unknown')
        risk_level_vi = self._get_risk_label_vi(risk_level)
        risk_color = self._get_risk_color(risk_level)
        
        elements.append(self._create_section_header('II. KẾT QUẢ CHẨN ĐOÁN'))
        elements.append(Spacer(1, 0.3*cm))
        
        # Main result box
        risk_percentage = f'{risk_score * 100:.1f}%'
        
        # Use non-breaking spaces to keep text together
        risk_level_display = risk_level_vi.upper().replace(' ', '\u00A0')
        
        result_box = Table(
            [[
                Paragraph('<b>Điểm nguy cơ đột quỵ</b>', self.styles['BoldText']),
                Paragraph(f'<font size="24"><b>{risk_percentage}</b></font>', self.styles['CustomNormal']),
                Paragraph(f'<font size="14"><b>{risk_level_display}</b></font>', self.styles['CustomNormal'])
            ]],
            colWidths=[2.0*inch, 2.2*inch, 2.5*inch]
        )
        result_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#f0f0f0')),
            ('BACKGROUND', (1, 0), (1, 0), colors.white),
            ('BACKGROUND', (2, 0), (2, 0), colors.HexColor('#e8e8e8')),
            ('BOX', (0, 0), (-1, -1), 2, colors.black),
            ('INNERGRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ]))
        elements.append(result_box)
        elements.append(Spacer(1, 0.4*cm))
        
        # Risk interpretation
        if risk_score >= 0.66:
            interpretation = "Bệnh nhân có nguy cơ đột quỵ CAO. Cần can thiệp y tế NGAY LẬP TỨC và theo dõi chặt chẽ."
            prefix = "[!!!]"
        elif risk_score >= 0.33:
            interpretation = "Bệnh nhân có nguy cơ đột quỵ TRUNG BÌNH. Cần theo dõi và điều chỉnh lối sống."
            prefix = "[!!]"
        else:
            interpretation = "Bệnh nhân có nguy cơ đột quỵ THẤP. Duy trì lối sống lành mạnh."
            prefix = "[OK]"
        
        interp_table = Table(
            [[Paragraph(f'<b>{prefix} ĐÁNH GIÁ:</b> {interpretation}', self.styles['CustomNormal'])]],
            colWidths=[6.7*inch]
        )
        interp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f5f5f5')),
            ('BOX', (0, 0), (-1, -1), 1.5, colors.black),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(interp_table)
        elements.append(Spacer(1, 0.6*cm))
        
        # === SECTION 3: RECOMMENDATIONS ===
        if 'recommendations' in prediction_result and prediction_result['recommendations']:
            elements.append(self._create_section_header('III. KHUYẾN NGHỊ Y TẾ'))
            elements.append(Spacer(1, 0.3*cm))
            
            rec_data = []
            for idx, rec in enumerate(prediction_result['recommendations'], 1):
                rec_data.append([
                    Paragraph(f'<b>{idx}</b>', self.styles['BoldText']),
                    Paragraph(rec, self.styles['CustomNormal'])
                ])
            
            rec_table = Table(rec_data, colWidths=[0.4*inch, 6.3*inch])
            rec_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f5f5f5')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ]))
            elements.append(rec_table)
            elements.append(Spacer(1, 0.6*cm))
        
        # === SECTION 4: CLINICAL NOTES ===
        elements.append(self._create_section_header('IV. LƯU Ý LÂM SÀNG'))
        elements.append(Spacer(1, 0.3*cm))
        
        if risk_score >= 0.66:
            notes = [
                "• Khám bác sĩ chuyên khoa tim mạch/thần kinh NGAY",
                "• Xét nghiệm chuyên sâu: CT/MRI não, siêu âm tim, điện tim",
                "• Kiểm soát chặt chẽ huyết áp (<140/90 mmHg)",
                "• Kiểm tra đường huyết, lipid máu định kỳ",
                "• Tuân thủ nghiêm ngặt phác đồ điều trị"
            ]
        elif risk_score >= 0.33:
            notes = [
                "• Tái khám định kỳ 3-6 tháng/lần",
                "• Theo dõi huyết áp, đường huyết hàng tuần",
                "• Điều chỉnh chế độ ăn: giảm muối, đường, chất béo",
                "• Tập thể dục nhẹ nhàng 30 phút/ngày",
                "• Duy trì cân nặng hợp lý (BMI 18.5-24.9)"
            ]
        else:
            notes = [
                "• Khám sức khỏe định kỳ hàng năm",
                "• Duy trì chế độ ăn cân bằng, nhiều rau xanh",
                "• Tập thể dục đều đặn ít nhất 150 phút/tuần",
                "• Không hút thuốc lá, hạn chế rượu bia",
                "• Theo dõi cân nặng và huyết áp tại nhà"
            ]
        
        for note in notes:
            elements.append(Paragraph(note, self.styles['CustomNormal']))
            elements.append(Spacer(1, 0.15*cm))
        
        elements.append(Spacer(1, 0.5*cm))
        
        # === DISCLAIMER ===
        disclaimer_table = Table(
            [[Paragraph(
                '<i><b>LƯU Ý:</b> Báo cáo này được tạo bởi hệ thống AI/Machine Learning hỗ trợ chẩn đoán. '
                'Kết quả chỉ mang tính tham khảo, KHÔNG THAY THẾ chẩn đoán và điều trị của bác sĩ. '
                'Vui lòng đến cơ sở y tế để được thăm khám trực tiếp.</i>',
                self.styles['InfoText']
            )]],
            colWidths=[6.7*inch]
        )
        disclaimer_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f0f0')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#bfbfbf')),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(disclaimer_table)
        elements.append(Spacer(1, 0.6*cm))
        
        # === SIGNATURE ===
        sig_data = [
            ['', Paragraph('<b>BÁC SĨ CHẨN ĐOÁN</b>', self.styles['BoldText'])],
            ['', ''],
            ['', ''],
            ['', Paragraph('<i>(Ký tên và đóng dấu)</i>', self.styles['InfoText'])]
        ]
        sig_table = Table(sig_data, colWidths=[3.5*inch, 3.2*inch])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('VALIGN', (1, 0), (1, -1), 'TOP'),
        ]))
        elements.append(sig_table)
        
        # === FOOTER ===
        elements.append(Spacer(1, 0.3*cm))
        footer_hospital_name = os.getenv('HOSPITAL_NAME', 'BỆNH VIỆN ĐA KHOA TRUNG TÂM')
        hospital_phone = os.getenv('HOSPITAL_PHONE', '1900-xxxx')
        hospital_email = os.getenv('HOSPITAL_EMAIL', 'timach@hospital.vn')
        footer = Paragraph(
            f'<para align="center"><font size="7" color="#666666">'
            f'Hệ thống Dự đoán Nguy cơ Đột quỵ - AI/ML Stroke Prediction System v1.0<br/>'
            f'© 2025 {footer_hospital_name}. Tất cả các quyền được bảo lưu.<br/>'
            f'Hotline: {hospital_phone} | Email: {hospital_email}'
            f'</font></para>',
            self.styles['InfoText']
        )
        elements.append(footer)
        
        # Build PDF
        doc.build(elements)
        
        buffer.seek(0)
        return buffer


# Singleton instance
report_service = ReportService()
