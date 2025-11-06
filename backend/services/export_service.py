"""
Export Service
Handles data export in multiple formats: CSV, JSON, and PDF.
"""

import io
import csv
import json
from datetime import date, datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.platypus import Image as RLImage
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from models import User, FoodEntry, ExerciseEntry, WeightLog, WaterLog, BodyMeasurement


def get_user_data(
    db: Session,
    user_id: int,
    start_date: date,
    end_date: date,
    data_types: List[str]
) -> Dict[str, Any]:
    """
    Fetch user data for export based on date range and selected data types.
    
    Args:
        db: Database session
        user_id: User ID
        start_date: Start date for data range
        end_date: End date for data range
        data_types: List of data types to include ('food', 'exercise', 'weight', 'water', 'measurements')
    
    Returns:
        Dictionary containing requested data
    """
    data = {}
    
    # Get user info
    user = db.query(User).filter(User.id == user_id).first()
    data['user'] = {
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'export_date': datetime.now().isoformat(),
        'date_range': f"{start_date} to {end_date}"
    }
    
    # Food entries
    if 'food' in data_types:
        food_entries = db.query(FoodEntry).filter(
            FoodEntry.user_id == user_id,
            FoodEntry.entry_date >= start_date,
            FoodEntry.entry_date <= end_date
        ).order_by(FoodEntry.entry_date, FoodEntry.meal_type).all()
        
        data['food_entries'] = [{
            'date': str(entry.entry_date),
            'meal_type': entry.meal_type,
            'food_name': entry.food_name,
            'brand_name': entry.brand_name or '',
            'quantity': entry.quantity,
            'unit': entry.unit,
            'calories': entry.calories,
            'protein_g': entry.protein_g,
            'carbs_g': entry.carbs_g,
            'fat_g': entry.fat_g,
        } for entry in food_entries]
    
    # Exercise entries
    if 'exercise' in data_types:
        exercise_entries = db.query(ExerciseEntry).filter(
            ExerciseEntry.user_id == user_id,
            ExerciseEntry.entry_date >= start_date,
            ExerciseEntry.entry_date <= end_date
        ).order_by(ExerciseEntry.entry_date).all()
        
        data['exercise_entries'] = [{
            'date': str(entry.entry_date),
            'exercise_name': entry.exercise_name,
            'duration_minutes': entry.duration_minutes,
            'calories_burned': entry.calories_burned,
            'notes': entry.notes or '',
        } for entry in exercise_entries]
    
    # Weight logs
    if 'weight' in data_types:
        weight_logs = db.query(WeightLog).filter(
            WeightLog.user_id == user_id,
            WeightLog.log_date >= start_date,
            WeightLog.log_date <= end_date
        ).order_by(WeightLog.log_date).all()
        
        data['weight_logs'] = [{
            'date': str(log.log_date),
            'weight_kg': log.weight_kg,
            'notes': log.notes or '',
        } for log in weight_logs]
    
    # Water logs
    if 'water' in data_types:
        water_logs = db.query(WaterLog).filter(
            WaterLog.user_id == user_id,
            WaterLog.log_date >= start_date,
            WaterLog.log_date <= end_date
        ).order_by(WaterLog.log_date).all()
        
        data['water_logs'] = [{
            'date': str(log.log_date),
            'cups': log.cups,
            'ml': log.ml,
        } for log in water_logs]
    
    # Body measurements
    if 'measurements' in data_types:
        measurements = db.query(BodyMeasurement).filter(
            BodyMeasurement.user_id == user_id,
            BodyMeasurement.measurement_date >= start_date,
            BodyMeasurement.measurement_date <= end_date
        ).order_by(BodyMeasurement.measurement_date).all()
        
        data['body_measurements'] = [{
            'date': str(m.measurement_date),
            'waist_cm': m.waist_cm,
            'hips_cm': m.hips_cm,
            'chest_cm': m.chest_cm,
            'arms_cm': m.arms_cm,
            'thighs_cm': m.thighs_cm,
            'calves_cm': m.calves_cm,
            'neck_cm': m.neck_cm,
            'shoulders_cm': m.shoulders_cm,
            'body_fat_percentage': m.body_fat_percentage,
            'muscle_mass_kg': m.muscle_mass_kg,
            'notes': m.notes or '',
        } for m in measurements]
    
    return data


def generate_csv_export(data: Dict[str, Any]) -> io.StringIO:
    """
    Generate CSV export with separate sections for each data type.
    
    Args:
        data: User data dictionary
    
    Returns:
        StringIO object containing CSV data
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['FitTrack+ Data Export'])
    writer.writerow(['User:', data['user']['email']])
    writer.writerow(['Export Date:', data['user']['export_date']])
    writer.writerow(['Date Range:', data['user']['date_range']])
    writer.writerow([])
    
    # Food entries
    if 'food_entries' in data and data['food_entries']:
        writer.writerow(['FOOD ENTRIES'])
        writer.writerow(['Date', 'Meal Type', 'Food Name', 'Brand', 'Quantity', 'Unit', 
                        'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'])
        for entry in data['food_entries']:
            writer.writerow([
                entry['date'], entry['meal_type'], entry['food_name'], entry['brand_name'],
                entry['quantity'], entry['unit'], entry['calories'], entry['protein_g'],
                entry['carbs_g'], entry['fat_g']
            ])
        writer.writerow([])
    
    # Exercise entries
    if 'exercise_entries' in data and data['exercise_entries']:
        writer.writerow(['EXERCISE ENTRIES'])
        writer.writerow(['Date', 'Exercise Name', 'Duration (min)', 'Calories Burned', 'Notes'])
        for entry in data['exercise_entries']:
            writer.writerow([
                entry['date'], entry['exercise_name'], entry['duration_minutes'],
                entry['calories_burned'], entry['notes']
            ])
        writer.writerow([])
    
    # Weight logs
    if 'weight_logs' in data and data['weight_logs']:
        writer.writerow(['WEIGHT LOGS'])
        writer.writerow(['Date', 'Weight (kg)', 'Notes'])
        for log in data['weight_logs']:
            writer.writerow([log['date'], log['weight_kg'], log['notes']])
        writer.writerow([])
    
    # Water logs
    if 'water_logs' in data and data['water_logs']:
        writer.writerow(['WATER INTAKE'])
        writer.writerow(['Date', 'Cups (8oz)', 'Milliliters'])
        for log in data['water_logs']:
            writer.writerow([log['date'], log['cups'], log['ml']])
        writer.writerow([])
    
    # Body measurements
    if 'body_measurements' in data and data['body_measurements']:
        writer.writerow(['BODY MEASUREMENTS'])
        writer.writerow(['Date', 'Waist (cm)', 'Hips (cm)', 'Chest (cm)', 'Arms (cm)', 
                        'Thighs (cm)', 'Calves (cm)', 'Neck (cm)', 'Shoulders (cm)',
                        'Body Fat %', 'Muscle Mass (kg)', 'Notes'])
        for m in data['body_measurements']:
            writer.writerow([
                m['date'], m['waist_cm'], m['hips_cm'], m['chest_cm'], m['arms_cm'],
                m['thighs_cm'], m['calves_cm'], m['neck_cm'], m['shoulders_cm'],
                m['body_fat_percentage'], m['muscle_mass_kg'], m['notes']
            ])
        writer.writerow([])
    
    output.seek(0)
    return output


def generate_json_export(data: Dict[str, Any]) -> str:
    """
    Generate JSON export with all data.
    
    Args:
        data: User data dictionary
    
    Returns:
        JSON string
    """
    return json.dumps(data, indent=2, default=str)


def generate_pdf_report(data: Dict[str, Any]) -> io.BytesIO:
    """
    Generate PDF report with summary statistics and tables.
    
    Args:
        data: User data dictionary
    
    Returns:
        BytesIO object containing PDF data
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#EC4899'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#3B82F6'),
        spaceAfter=12,
    )
    
    # Title
    elements.append(Paragraph("FitTrack+ Data Export", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # User Info
    user_info = [
        ['User:', data['user']['email']],
        ['Name:', f"{data['user'].get('first_name', '')} {data['user'].get('last_name', '')}".strip()],
        ['Export Date:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
        ['Date Range:', data['user']['date_range']],
    ]
    user_table = Table(user_info, colWidths=[2*inch, 4*inch])
    user_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F3F4F6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(user_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Summary Statistics
    elements.append(Paragraph("Summary Statistics", heading_style))
    
    summary_data = [['Data Type', 'Count']]
    if 'food_entries' in data:
        summary_data.append(['Food Entries', str(len(data['food_entries']))])
    if 'exercise_entries' in data:
        summary_data.append(['Exercise Entries', str(len(data['exercise_entries']))])
    if 'weight_logs' in data:
        summary_data.append(['Weight Logs', str(len(data['weight_logs']))])
    if 'water_logs' in data:
        summary_data.append(['Water Logs', str(len(data['water_logs']))])
    if 'body_measurements' in data:
        summary_data.append(['Body Measurements', str(len(data['body_measurements']))])
    
    summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3B82F6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Food Entries Summary (if available)
    if 'food_entries' in data and data['food_entries']:
        elements.append(PageBreak())
        elements.append(Paragraph("Food Entries Summary", heading_style))
        elements.append(Spacer(1, 0.1*inch))
        
        # Calculate totals
        total_calories = sum(e['calories'] for e in data['food_entries'])
        total_protein = sum(e['protein_g'] for e in data['food_entries'])
        total_carbs = sum(e['carbs_g'] for e in data['food_entries'])
        total_fat = sum(e['fat_g'] for e in data['food_entries'])
        
        totals_data = [
            ['Total Calories', f"{total_calories:.0f} cal"],
            ['Total Protein', f"{total_protein:.1f} g"],
            ['Total Carbohydrates', f"{total_carbs:.1f} g"],
            ['Total Fat', f"{total_fat:.1f} g"],
        ]
        
        totals_table = Table(totals_data, colWidths=[3*inch, 2*inch])
        totals_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#FEE2E2')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        elements.append(totals_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Recent entries (limited to 20)
        elements.append(Paragraph("Recent Food Entries (Last 20)", styles['Heading3']))
        food_data = [['Date', 'Meal', 'Food', 'Calories']]
        for entry in data['food_entries'][-20:]:
            food_data.append([
                entry['date'],
                entry['meal_type'],
                entry['food_name'][:30],
                f"{entry['calories']:.0f}"
            ])
        
        food_table = Table(food_data, colWidths=[1.2*inch, 1*inch, 2.5*inch, 1*inch])
        food_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EC4899')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FFF1F2')]),
        ]))
        elements.append(food_table)
    
    # Weight Progress (if available)
    if 'weight_logs' in data and data['weight_logs'] and len(data['weight_logs']) >= 2:
        elements.append(PageBreak())
        elements.append(Paragraph("Weight Progress", heading_style))
        elements.append(Spacer(1, 0.1*inch))
        
        first_weight = data['weight_logs'][0]['weight_kg']
        last_weight = data['weight_logs'][-1]['weight_kg']
        weight_change = last_weight - first_weight
        
        progress_data = [
            ['Starting Weight', f"{first_weight:.1f} kg"],
            ['Current Weight', f"{last_weight:.1f} kg"],
            ['Total Change', f"{weight_change:+.1f} kg"],
        ]
        
        progress_table = Table(progress_data, colWidths=[3*inch, 2*inch])
        progress_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#DBEAFE')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        elements.append(progress_table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

