<?php

namespace Tests\Unit;

use Modules\Protocol\app\Models\Protocol;
use Tests\TestCase;

class ProtocolModelTest extends TestCase
{
    public function test_status_label_contains_comite_cientifico_and_bioetica(): void
    {
        $protocol = new Protocol();

        $protocol->status = Protocol::STATUS_PENDING_COMITE_CIENTIFICO;
        $this->assertSame('Encaminhado ao Comite Cientifico', $protocol->status_label);

        $protocol->status = Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO;
        $this->assertSame('Em avaliacao pelo Comite Cientifico', $protocol->status_label);

        $protocol->status = Protocol::STATUS_PENDING_COMITE_BIOETICA;
        $this->assertSame('Encaminhado ao Comite de Bioetica', $protocol->status_label);

        $protocol->status = Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA;
        $this->assertSame('Em avaliacao pelo Comite de Bioetica', $protocol->status_label);
    }

    public function test_form_organ_from_organ_type_maps_correctly(): void
    {
        $this->assertSame('nucleo', Protocol::formOrganFromOrganType(Protocol::ORGAN_TYPE_NUCLEUS));
        $this->assertSame('comite_cientifico', Protocol::formOrganFromOrganType(Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE));
        $this->assertSame('comite_bioetica', Protocol::formOrganFromOrganType(Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE));
    }

    public function test_organ_type_from_form_organ_maps_correctly(): void
    {
        $this->assertSame(Protocol::ORGAN_TYPE_NUCLEUS, Protocol::organTypeFromFormOrgan(Protocol::ORGAN_NUCLEO));
        $this->assertSame(Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE, Protocol::organTypeFromFormOrgan(Protocol::ORGAN_COMITE_CIENTIFICO));
        $this->assertSame(Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE, Protocol::organTypeFromFormOrgan(Protocol::ORGAN_COMITE_BIOETICA));
    }

    public function test_organ_flow_contains_expected_transitions(): void
    {
        $this->assertSame(Protocol::STATUS_PENDING_COMITE_CIENTIFICO, Protocol::ORGAN_FLOW[Protocol::ORGAN_TYPE_NUCLEUS]['next_status']);
        $this->assertSame(Protocol::STATUS_IN_REVIEW_NUCLEO, Protocol::ORGAN_FLOW[Protocol::ORGAN_TYPE_NUCLEUS]['in_review_status']);
        $this->assertSame(Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE, Protocol::ORGAN_FLOW[Protocol::ORGAN_TYPE_NUCLEUS]['next_organ_type']);

        $this->assertSame(Protocol::STATUS_PENDING_COMITE_BIOETICA, Protocol::ORGAN_FLOW[Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE]['next_status']);
        $this->assertSame(Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO, Protocol::ORGAN_FLOW[Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE]['in_review_status']);
        $this->assertSame(Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE, Protocol::ORGAN_FLOW[Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE]['next_organ_type']);

        $this->assertSame(Protocol::STATUS_APPROVED_FINAL, Protocol::ORGAN_FLOW[Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE]['next_status']);
        $this->assertSame(Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA, Protocol::ORGAN_FLOW[Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE]['in_review_status']);
        $this->assertNull(Protocol::ORGAN_FLOW[Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE]['next_organ_type']);
    }

    public function test_version_helpers_restart_by_stage_without_padding(): void
    {
        $this->assertSame('V1', Protocol::submissionVersionLabel(1));
        $this->assertSame('V12', Protocol::submissionVersionLabel(12));

        $this->assertSame('NC_V1', Protocol::organVersionLabel(Protocol::ORGAN_TYPE_NUCLEUS));
        $this->assertSame('CC_V1', Protocol::organVersionLabel(Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE));
        $this->assertSame('CC_V2', Protocol::organVersionLabel(Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE, 2));
        $this->assertSame('CIBS_V1', Protocol::organVersionLabel(Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE));
    }
}
