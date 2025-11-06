"""
Export Router
API endpoints for exporting user data in various formats.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from models import User
from utils.auth import get_db, get_current_user
from services.export_service import (
    get_user_data,
    generate_csv_export,
    generate_json_export,
    generate_pdf_report
)

router = APIRouter(prefix="/export", tags=["Data Export"])


@router.get("/csv")
def export_csv(
    start_date: date = Query(default=None, description="Start date for export"),
    end_date: date = Query(default=None, description="End date for export"),
    days: int = Query(default=30, ge=1, le=365, description="Number of days to export (if dates not specified)"),
    data_types: List[str] = Query(
        default=["food", "exercise", "weight", "water", "measurements"],
        description="Data types to include in export"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export user data as CSV file.
    
    Query Parameters:
    - start_date: Start date (YYYY-MM-DD)
    - end_date: End date (YYYY-MM-DD)
    - days: Number of days to export (default 30, max 365) - used if dates not specified
    - data_types: List of data types to include (food, exercise, weight, water, measurements)
    
    Returns:
    - CSV file download
    """
    # Determine date range
    if not start_date or not end_date:
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)
    
    # Fetch data
    data = get_user_data(db, current_user.id, start_date, end_date, data_types)
    
    # Generate CSV
    csv_output = generate_csv_export(data)
    
    # Create filename with timestamp
    filename = f"fittrack_plus_export_{date.today()}.csv"
    
    return StreamingResponse(
        iter([csv_output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/json")
def export_json(
    start_date: date = Query(default=None, description="Start date for export"),
    end_date: date = Query(default=None, description="End date for export"),
    days: int = Query(default=30, ge=1, le=365, description="Number of days to export (if dates not specified)"),
    data_types: List[str] = Query(
        default=["food", "exercise", "weight", "water", "measurements"],
        description="Data types to include in export"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export user data as JSON file.
    
    Query Parameters:
    - start_date: Start date (YYYY-MM-DD)
    - end_date: End date (YYYY-MM-DD)
    - days: Number of days to export (default 30, max 365) - used if dates not specified
    - data_types: List of data types to include (food, exercise, weight, water, measurements)
    
    Returns:
    - JSON file download
    """
    # Determine date range
    if not start_date or not end_date:
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)
    
    # Fetch data
    data = get_user_data(db, current_user.id, start_date, end_date, data_types)
    
    # Generate JSON
    json_output = generate_json_export(data)
    
    # Create filename with timestamp
    filename = f"fittrack_plus_export_{date.today()}.json"
    
    return StreamingResponse(
        iter([json_output]),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/pdf")
def export_pdf(
    start_date: date = Query(default=None, description="Start date for export"),
    end_date: date = Query(default=None, description="End date for export"),
    days: int = Query(default=30, ge=1, le=365, description="Number of days to export (if dates not specified)"),
    data_types: List[str] = Query(
        default=["food", "exercise", "weight", "water", "measurements"],
        description="Data types to include in export"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export user data as PDF report.
    
    Query Parameters:
    - start_date: Start date (YYYY-MM-DD)
    - end_date: End date (YYYY-MM-DD)
    - days: Number of days to export (default 30, max 365) - used if dates not specified
    - data_types: List of data types to include (food, exercise, weight, water, measurements)
    
    Returns:
    - PDF file download
    """
    # Determine date range
    if not start_date or not end_date:
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)
    
    # Fetch data
    data = get_user_data(db, current_user.id, start_date, end_date, data_types)
    
    # Generate PDF
    pdf_buffer = generate_pdf_report(data)
    
    # Create filename with timestamp
    filename = f"fittrack_plus_report_{date.today()}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/all")
def export_all(
    start_date: date = Query(default=None, description="Start date for export"),
    end_date: date = Query(default=None, description="End date for export"),
    days: int = Query(default=365, ge=1, le=365, description="Number of days to export (default: all data)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export all user data as JSON (complete backup).
    
    Query Parameters:
    - start_date: Start date (YYYY-MM-DD)
    - end_date: End date (YYYY-MM-DD)  
    - days: Number of days to export (default 365) - used if dates not specified
    
    Returns:
    - JSON file download with all data
    """
    # Determine date range - default to all data
    if not start_date or not end_date:
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)
    
    # Fetch all data types
    data_types = ["food", "exercise", "weight", "water", "measurements"]
    data = get_user_data(db, current_user.id, start_date, end_date, data_types)
    
    # Generate JSON
    json_output = generate_json_export(data)
    
    # Create filename with timestamp
    filename = f"fittrack_plus_complete_backup_{date.today()}.json"
    
    return StreamingResponse(
        iter([json_output]),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

