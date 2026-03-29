from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.dependencies import get_db, get_current_user
from app.models.workflow import Workflow, VisibilityEnum
from app.models.membership import OrganisationMembership
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowOut

router = APIRouter(prefix="/workflows", tags=["workflows"])

@router.post("", response_model=WorkflowOut)
def create_workflow(data: WorkflowCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    wf = Workflow(**data.model_dump(), created_by=user.id)
    db.add(wf)
    db.commit()
    db.refresh(wf)
    return wf

@router.get("", response_model=list[WorkflowOut])
def list_workflows(db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_org_ids = [m.organisation_id for m in user.memberships]
    from sqlalchemy import or_
    return db.query(Workflow).filter(
        or_(
            Workflow.visibility == VisibilityEnum.PUBLIC,
            Workflow.created_by == user.id,
            Workflow.organisation_id.in_(user_org_ids),
        )
    ).all()

@router.get("/{wf_id}", response_model=WorkflowOut)
def get_workflow(wf_id: UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    wf = db.query(Workflow).filter(Workflow.id == wf_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Not found")
    return wf

@router.patch("/{wf_id}", response_model=WorkflowOut)
def update_workflow(wf_id: UUID, data: WorkflowUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    wf = db.query(Workflow).filter(Workflow.id == wf_id, Workflow.created_by == user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Not found or not yours")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(wf, field, value)
    db.commit()
    db.refresh(wf)
    return wf

@router.delete("/{wf_id}")
def delete_workflow(wf_id: UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    wf = db.query(Workflow).filter(Workflow.id == wf_id, Workflow.created_by == user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Not found or not yours")
    db.delete(wf)
    db.commit()
    return {"detail": "Deleted"}