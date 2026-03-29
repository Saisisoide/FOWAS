from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.dependencies import get_db, get_current_user
from app.models.organisation import Organisation
from app.models.membership import OrganisationMembership, RoleEnum
from app.models.user import User
from app.schemas.organisation import OrgCreate, OrgOut, InviteRequest, UpdateRoleRequest

router = APIRouter(prefix="/organisations", tags=["organisations"])

@router.post("", response_model=OrgOut)
def create_org(data: OrgCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    org = Organisation(name=data.name, created_by=user.id)
    db.add(org)
    db.flush()
    membership = OrganisationMembership(organisation_id=org.id, user_id=user.id, role=RoleEnum.OWNER)
    db.add(membership)
    db.commit()
    db.refresh(org)
    return org

@router.get("", response_model=list[OrgOut])
def list_orgs(db: Session = Depends(get_db), user=Depends(get_current_user)):
    org_ids = [m.organisation_id for m in user.memberships]
    return db.query(Organisation).filter(Organisation.id.in_(org_ids)).all()

@router.post("/{org_id}/invite")
def invite_member(org_id: UUID, data: InviteRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    membership = db.query(OrganisationMembership).filter_by(organisation_id=org_id, user_id=user.id).first()
    if not membership or membership.role not in [RoleEnum.OWNER, RoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    invitee = db.query(User).filter(User.email == data.email).first()
    if not invitee:
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.query(OrganisationMembership).filter_by(organisation_id=org_id, user_id=invitee.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already a member")
    new_m = OrganisationMembership(organisation_id=org_id, user_id=invitee.id, role=data.role)
    db.add(new_m)
    db.commit()
    return {"detail": "Invited"}

@router.patch("/{org_id}/members/{uid}")
def update_role(org_id: UUID, uid: UUID, data: UpdateRoleRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    caller = db.query(OrganisationMembership).filter_by(organisation_id=org_id, user_id=user.id).first()
    if not caller or caller.role not in [RoleEnum.OWNER, RoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    target = db.query(OrganisationMembership).filter_by(organisation_id=org_id, user_id=uid).first()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    target.role = data.role
    db.commit()
    return {"detail": "Role updated"}

@router.delete("/{org_id}/members/{uid}")
def remove_member(org_id: UUID, uid: UUID, db: Session = Depends(get_db), user=Depends(get_current_user)):
    caller = db.query(OrganisationMembership).filter_by(organisation_id=org_id, user_id=user.id).first()
    if not caller or caller.role not in [RoleEnum.OWNER, RoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    target = db.query(OrganisationMembership).filter_by(organisation_id=org_id, user_id=uid).first()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(target)
    db.commit()
    return {"detail": "Removed"}