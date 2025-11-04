"""
Body Measurements Router
Handles body measurement tracking and progress analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import date, timedelta
from schemas.measurement_schemas import (
    MeasurementCreate, MeasurementUpdate, MeasurementResponse,
    MeasurementComparison, MeasurementSummary
)
from models import User, BodyMeasurement
from utils.auth import get_db, get_current_user

router = APIRouter(prefix="/measurements", tags=["Body Measurements"])


@router.post("/", response_model=MeasurementResponse, status_code=status.HTTP_201_CREATED)
def create_measurement(
    measurement_data: MeasurementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log body measurements for a specific date.
    
    - Creates a new measurement entry
    - All measurements are optional
    - Measurements are stored in centimeters
    """
    # Check if measurement already exists for this date
    existing = db.query(BodyMeasurement).filter(
        and_(
            BodyMeasurement.user_id == current_user.id,
            BodyMeasurement.measurement_date == measurement_data.measurement_date
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Measurement already exists for {measurement_data.measurement_date}. Use PUT to update."
        )
    
    measurement = BodyMeasurement(
        user_id=current_user.id,
        measurement_date=measurement_data.measurement_date,
        waist_cm=measurement_data.waist_cm,
        hips_cm=measurement_data.hips_cm,
        chest_cm=measurement_data.chest_cm,
        arms_cm=measurement_data.arms_cm,
        thighs_cm=measurement_data.thighs_cm,
        calves_cm=measurement_data.calves_cm,
        neck_cm=measurement_data.neck_cm,
        shoulders_cm=measurement_data.shoulders_cm,
        body_fat_percentage=measurement_data.body_fat_percentage,
        muscle_mass_kg=measurement_data.muscle_mass_kg,
        notes=measurement_data.notes
    )
    
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    
    return measurement


@router.get("/", response_model=List[MeasurementResponse])
def get_measurements(
    start_date: Optional[date] = Query(default=None, description="Start date"),
    end_date: Optional[date] = Query(default=None, description="End date"),
    days: int = Query(default=90, ge=1, le=365, description="Number of days to fetch"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get measurement history.
    
    Can filter by:
    - Date range (start_date and end_date)
    - Last N days (days parameter)
    """
    if start_date and end_date:
        # Use provided date range
        pass
    else:
        # Use days parameter
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)
    
    measurements = db.query(BodyMeasurement).filter(
        BodyMeasurement.user_id == current_user.id,
        BodyMeasurement.measurement_date >= start_date,
        BodyMeasurement.measurement_date <= end_date
    ).order_by(desc(BodyMeasurement.measurement_date)).all()
    
    return measurements


@router.get("/latest", response_model=MeasurementResponse)
def get_latest_measurement(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the most recent measurement entry.
    """
    measurement = db.query(BodyMeasurement).filter(
        BodyMeasurement.user_id == current_user.id
    ).order_by(desc(BodyMeasurement.measurement_date)).first()
    
    if not measurement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No measurements found"
        )
    
    return measurement


@router.get("/{measurement_id}", response_model=MeasurementResponse)
def get_measurement(
    measurement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific measurement by ID.
    """
    measurement = db.query(BodyMeasurement).filter(
        and_(
            BodyMeasurement.id == measurement_id,
            BodyMeasurement.user_id == current_user.id
        )
    ).first()
    
    if not measurement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Measurement not found"
        )
    
    return measurement


@router.put("/{measurement_id}", response_model=MeasurementResponse)
def update_measurement(
    measurement_id: int,
    measurement_data: MeasurementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a measurement entry.
    """
    measurement = db.query(BodyMeasurement).filter(
        and_(
            BodyMeasurement.id == measurement_id,
            BodyMeasurement.user_id == current_user.id
        )
    ).first()
    
    if not measurement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Measurement not found"
        )
    
    # Update only provided fields
    for field, value in measurement_data.dict(exclude_unset=True).items():
        setattr(measurement, field, value)
    
    db.commit()
    db.refresh(measurement)
    
    return measurement


@router.delete("/{measurement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_measurement(
    measurement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a measurement entry.
    """
    measurement = db.query(BodyMeasurement).filter(
        and_(
            BodyMeasurement.id == measurement_id,
            BodyMeasurement.user_id == current_user.id
        )
    ).first()
    
    if not measurement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Measurement not found"
        )
    
    db.delete(measurement)
    db.commit()
    
    return None


@router.get("/comparison/current")
def get_measurement_comparison(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compare current measurements with previous measurements.
    
    Returns:
    - Current (most recent) measurement
    - Previous measurement
    - Changes between them
    """
    # Get the two most recent measurements
    measurements = db.query(BodyMeasurement).filter(
        BodyMeasurement.user_id == current_user.id
    ).order_by(desc(BodyMeasurement.measurement_date)).limit(2).all()
    
    if not measurements:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No measurements found"
        )
    
    current = measurements[0]
    previous = measurements[1] if len(measurements) > 1 else None
    
    # Calculate changes
    changes = {}
    if previous:
        fields = ['waist_cm', 'hips_cm', 'chest_cm', 'arms_cm', 'thighs_cm', 
                  'calves_cm', 'neck_cm', 'shoulders_cm', 'body_fat_percentage']
        
        for field in fields:
            current_val = getattr(current, field)
            previous_val = getattr(previous, field)
            
            if current_val is not None and previous_val is not None:
                change = current_val - previous_val
                changes[field] = {
                    "change_cm": round(change, 2),
                    "change_inches": round(change / 2.54, 2),
                    "percentage": round((change / previous_val) * 100, 2) if previous_val != 0 else 0
                }
    
    return {
        "current_date": current.measurement_date,
        "previous_date": previous.measurement_date if previous else None,
        "current": current,
        "previous": previous,
        "changes": changes
    }


@router.get("/progress/summary", response_model=MeasurementSummary)
def get_measurement_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get summary of measurement progress.
    
    Returns:
    - Total measurements taken
    - First and latest measurement dates
    - Total changes (first to latest)
    - Individual measurement changes
    """
    measurements = db.query(BodyMeasurement).filter(
        BodyMeasurement.user_id == current_user.id
    ).order_by(BodyMeasurement.measurement_date).all()
    
    if not measurements:
        return MeasurementSummary(
            total_measurements=0,
            first_date=None,
            latest_date=None,
            total_cm_lost=None,
            total_inches_lost=None,
            waist_change_cm=None,
            hips_change_cm=None,
            chest_change_cm=None,
            arms_change_cm=None,
            thighs_change_cm=None
        )
    
    first = measurements[0]
    latest = measurements[-1]
    
    # Calculate total change across all measurements
    fields = ['waist_cm', 'hips_cm', 'chest_cm', 'arms_cm', 'thighs_cm']
    total_cm_lost = 0
    changes = {}
    
    for field in fields:
        first_val = getattr(first, field)
        latest_val = getattr(latest, field)
        
        if first_val is not None and latest_val is not None:
            change = latest_val - first_val
            changes[f"{field.replace('_cm', '')}_change_cm"] = round(change, 2)
            
            # Only count reductions (losses) toward total
            if change < 0:
                total_cm_lost += abs(change)
    
    total_inches_lost = total_cm_lost / 2.54 if total_cm_lost > 0 else 0
    
    return MeasurementSummary(
        total_measurements=len(measurements),
        first_date=first.measurement_date,
        latest_date=latest.measurement_date,
        total_cm_lost=round(total_cm_lost, 2) if total_cm_lost > 0 else None,
        total_inches_lost=round(total_inches_lost, 2) if total_inches_lost > 0 else None,
        **changes
    )


@router.get("/progress/chart")
def get_measurement_progress_chart(
    days: int = Query(default=90, ge=1, le=365, description="Number of days to fetch"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get measurement data formatted for charts.
    
    Returns time-series data for each measurement type.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    
    measurements = db.query(BodyMeasurement).filter(
        BodyMeasurement.user_id == current_user.id,
        BodyMeasurement.measurement_date >= start_date,
        BodyMeasurement.measurement_date <= end_date
    ).order_by(BodyMeasurement.measurement_date).all()
    
    # Format for charts
    chart_data = []
    for measurement in measurements:
        data_point = {
            "date": str(measurement.measurement_date),
            "waist_cm": measurement.waist_cm,
            "hips_cm": measurement.hips_cm,
            "chest_cm": measurement.chest_cm,
            "arms_cm": measurement.arms_cm,
            "thighs_cm": measurement.thighs_cm,
            "calves_cm": measurement.calves_cm,
            "neck_cm": measurement.neck_cm,
            "shoulders_cm": measurement.shoulders_cm,
            "body_fat_percentage": measurement.body_fat_percentage,
            "muscle_mass_kg": measurement.muscle_mass_kg
        }
        chart_data.append(data_point)
    
    return {"data": chart_data}

