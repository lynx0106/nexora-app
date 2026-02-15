import { IsEmail, IsIn, IsString } from 'class-validator';
import { Role } from '../../common/constants/roles';

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(Object.values(Role))
  role: string;
}
