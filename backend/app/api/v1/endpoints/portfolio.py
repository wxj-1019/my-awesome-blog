from typing import Any, List
from fastapi import APIRouter, Query, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_current_superuser
from app import crud
from app.schemas.portfolio import PortfolioItem, PortfolioItemCreate, PortfolioItemUpdate
from app.schemas.image import Image as ImageSchema
from app.models.user import User
from uuid import UUID

router = APIRouter()


@router.get("/", response_model=List[PortfolioItem])
def read_portfolio_items(
    skip: int = 0,
    limit: int = Query(100, ge=1, le=100),
    is_active: bool = True,
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve portfolio items
    """
    portfolio_items = crud.get_portfolios(
        db, 
        skip=skip, 
        limit=limit,
        is_featured=None if is_active else False
    )
    return portfolio_items


@router.post("/", response_model=PortfolioItem)
def create_portfolio_item(
    *,
    db: Session = Depends(get_db),
    portfolio_item_in: PortfolioItemCreate,
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Create new portfolio item
    """
    portfolio_item = crud.create_portfolio(db, portfolio=portfolio_item_in)
    return portfolio_item


@router.get("/{portfolio_item_id}", response_model=PortfolioItem)
def read_portfolio_item_by_id(
    portfolio_item_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get a specific portfolio item by id
    """
    try:
        item_uuid = UUID(portfolio_item_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portfolio item ID format",
        )
    
    portfolio_item = crud.get_portfolio(db, portfolio_id=item_uuid)
    if not portfolio_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio item not found",
        )
    
    return portfolio_item


@router.put("/{portfolio_item_id}", response_model=PortfolioItem)
def update_portfolio_item(
    *,
    db: Session = Depends(get_db),
    portfolio_item_id: str,
    portfolio_item_in: PortfolioItemUpdate,
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Update a portfolio item
    """
    try:
        item_uuid = UUID(portfolio_item_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portfolio item ID format",
        )
    
    portfolio_item = crud.get_portfolio(db, portfolio_id=item_uuid)
    if not portfolio_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio item not found",
        )
    
    portfolio_item = crud.update_portfolio(
        db, 
        portfolio_id=item_uuid, 
        portfolio_update=portfolio_item_in
    )
    return portfolio_item


@router.delete("/{portfolio_item_id}", response_model=dict)
def delete_portfolio_item(
    *,
    db: Session = Depends(get_db),
    portfolio_item_id: str,
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Delete a portfolio item
    """
    try:
        item_uuid = UUID(portfolio_item_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portfolio item ID format",
        )
    
    portfolio_item = crud.get_portfolio(db, portfolio_id=item_uuid)
    if not portfolio_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio item not found",
        )
    
    deleted = crud.delete_portfolio(db, portfolio_id=item_uuid)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio item not found",
        )
    
    return {"message": "Portfolio item deleted successfully"}


@router.get("/{portfolio_item_id}/images", response_model=List[ImageSchema])
def read_portfolio_images(
    portfolio_item_id: str,
    skip: int = 0,
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get all images for a specific portfolio item
    """
    try:
        item_uuid = UUID(portfolio_item_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portfolio item ID format",
        )
    
    images = crud.get_portfolio_images(db, portfolio_id=item_uuid, skip=skip, limit=limit)
    return images


@router.post("/{portfolio_item_id}/images/{image_id}", response_model=dict)
def add_image_to_portfolio_endpoint(
    portfolio_item_id: str,
    image_id: str,
    sort_order: int = 0,
    is_cover: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Add an image to a portfolio item
    """
    try:
        portfolio_uuid = UUID(portfolio_item_id)
        image_uuid = UUID(image_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portfolio item ID or image ID format",
        )
    
    portfolio_item = crud.get_portfolio(db, portfolio_id=portfolio_uuid)
    if not portfolio_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio item not found",
        )
    
    image = crud.get_image(db, image_id=image_uuid)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    
    crud.add_image_to_portfolio(
        db, 
        portfolio_id=portfolio_uuid, 
        image_id=image_uuid, 
        sort_order=sort_order, 
        is_cover=is_cover
    )
    
    return {"message": "Image added to portfolio successfully"}


@router.delete("/{portfolio_item_id}/images/{image_id}", response_model=dict)
def remove_image_from_portfolio_endpoint(
    portfolio_item_id: str,
    image_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> Any:
    """
    Remove an image from a portfolio item
    """
    try:
        portfolio_uuid = UUID(portfolio_item_id)
        image_uuid = UUID(image_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid portfolio item ID or image ID format",
        )
    
    success = crud.remove_image_from_portfolio(
        db, 
        portfolio_id=portfolio_uuid, 
        image_id=image_uuid
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found in portfolio or operation failed",
        )
    
    return {"message": "Image removed from portfolio successfully"}