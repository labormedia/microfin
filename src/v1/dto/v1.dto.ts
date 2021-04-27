import {
    validate,
    validateOrReject,
    Contains,
    IsInt,
    Length,
    IsEmail,
    IsFQDN,
    IsDate,
    Min,
    Max,
    IsString,
    IsOptional
  } from 'class-validator';

export class V1Dto {
    @IsOptional()
    @IsString()
    @Length(6)
    Pair: String

    @IsOptional()
    @IsString()
    @Length(2)
    Frame: String

    @IsOptional()
    @IsInt()
    @Max(2000000000000)
    Atom: Number

    @IsOptional()
    @IsInt()
    @Max(1000)
    Span: Number

    @IsOptional()
    @IsString()
    @Length(1,6)
    Analysis: String//"RSI" | "AS"
}